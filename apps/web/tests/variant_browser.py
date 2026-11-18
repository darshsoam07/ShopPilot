"""Rendered Edge regressions with synthetic API responses and a private Vite process."""
import base64
import struct
import os
from pathlib import Path
import socket
import subprocess
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import expect, sync_playwright

WEB = Path(__file__).resolve().parents[1]
PHOTOS = ["/demo/nova.jpg", *[f"/demo/nova-detail-{i}.jpg" for i in range(1, 5)]]
UPLOAD = "/media/alabaster.svg"
API = "http://fixture.invalid"
VIEWPORTS = [(1440, 900), (1280, 800), (850, 1024), (768, 1024), (390, 844), (360, 800)]


def product(identifier, sku, finish):
    return dict(id=identifier, sku=sku, name=f"Nova Wireless Headphones · {finish}, Standard",
                brand="Nova", category="Audio", specifications={"Finish": finish, "Configuration": "Standard"},
                price="4999.00", stock_quantity=5, description="Wireless headphones",
                image_url=PHOTOS[0], gallery_images=PHOTOS[1:])


def check_media(box, item, expected):
    box.scroll_into_view_if_needed()
    expect(box).to_be_visible()
    if expected:
        img = box.locator("img")
        expect(img).to_have_attribute("src", expected)
        expect(img).to_have_attribute("alt", item["name"])
        expect(img).to_have_js_property("complete", True)
        assert img.evaluate("img => img.naturalWidth > 0")
    else:
        expect(box.locator("img")).to_have_count(0)
        expect(box.get_by_role("img", name=item["name"] + " image unavailable")).to_be_visible()
        assert "nova" not in box.evaluate("el => getComputedStyle(el,'::after').backgroundImage")


def geometry(page, box):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), page.url
    bounds = box.bounding_box()
    assert bounds and min(bounds["width"], bounds["height"]) > 0
    return round(bounds["width"]), round(bounds["height"])


def exercise(browser, origin, width, height):
    page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.add_init_script("sessionStorage.setItem('shoppilot_access_token','fixture')")
    obs = product(1, "AUD-NOVA-001", "Obsidian")
    alb = product(2, "AUD-NOVA-ALB", "Alabaster")
    alb["price"] = "5299.00"
    items = [obs, alb]
    quantity = 2
    unavailable = False
    purchases = []
    solo = False

    def respond(route):
        nonlocal quantity
        url = urlsplit(route.request.url)
        path = url.path
        if path == UPLOAD:
            return route.fulfill(content_type="image/svg+xml", body='<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="ivory"/></svg>')
        if path.endswith("/auth/me"):
            data = dict(id=1, role="customer", full_name="Fixture", email="qa@example.invalid")
        elif "/cart" in path:
            if route.request.method == "POST":
                purchases.append(route.request.post_data_json)
            if route.request.method == "PATCH":
                quantity = route.request.post_data_json["quantity"]
            data = dict(items=[dict(id=p["id"], product=p, quantity=quantity, product_id=p["id"]) for p in items],
                        item_count=2*quantity, subtotal=quantity*(4999+5299))
        elif path.endswith("/variants"):
            data = [alb] if solo else items
        elif path.endswith("/reviews"):
            return route.fulfill(json=dict(reviews=[], can_review=False, digest=dict(total_reviews=0, average_rating=0, verified_count=0, sentiment_label="Unrated", summary=f"Reviews for product {path.split('/')[-2]}", pros=[], cons=[])))
        elif path.endswith("/products/1") or path.endswith("/products/2"):
            data = items[int(path[-1])-1]
        elif "/products" in path:
            sku = parse_qs(url.query).get("q", [None])[0]
            if unavailable and sku:
                return route.fulfill(status=503, json={"detail": "Fixture unavailable"})
            matches = [p for p in items if not sku or sku == p["sku"]]
            data = dict(items=matches, total=len(matches), categories={"Audio": 2}, page=1, page_size=12)
        else:
            data = []
        route.fulfill(json=data)

    page.route(API + "/**", respond)
    page.route("https://fonts.**", lambda route: route.abort())

    def visit(path):
        page.goto(origin + path, wait_until="domcontentloaded")

    visit("/products")
    expect(page.locator(".copilot-trigger")).to_be_visible()
    cards = page.locator(".product-card")
    expect(cards).to_have_count(2)
    for idx, image in enumerate([PHOTOS[0], None]):
        box = cards.nth(idx).locator(".product-image-wrap")
        check_media(box, items[idx], image)
        geometry(page, box)
        expect(cards.nth(idx).get_by_role("button", name="Add to cart")).to_be_enabled()
    cards.first.locator(".product-image-wrap").click()
    stage = page.locator(".gallery-stage")
    expect(page.locator(".gallery-thumbs button").first).to_have_attribute("aria-pressed", "true")
    layout = page.locator(".detail-layout")
    columns = layout.evaluate("el => getComputedStyle(el).gridTemplateColumns").split()
    assert len(columns) == (1 if width <= 850 else 2), (width, columns)
    if width <= 850:
        gallery_box = stage.bounding_box()
        panel_box = page.locator(".pdp-purchase").bounding_box()
        assert panel_box["y"] >= gallery_box["y"] + gallery_box["height"]
        assert panel_box["width"] >= 0.95 * layout.bounding_box()["width"]
    geometry(page, stage)
    expect(page.locator(".copilot-trigger")).to_have_count(0)
    for selector in [".gallery-stage", ".pdp-delivery"]:
        assert page.locator(selector).evaluate("el => parseFloat(getComputedStyle(el).borderTopWidth) > 0")
    for token in ["--color-ink", "--color-border", "--shop-panel", "--shop-accent", "--font-display"]:
        assert stage.evaluate("(el,t) => getComputedStyle(el).getPropertyValue(t).trim()", token)
    expect(page.get_by_label("Quantity", exact=True)).to_have_value("1")
    expect(page.locator(".pdp-purchase [role=status]")).to_be_empty()
    expect(page.get_by_role("dialog")).to_have_count(0)
    # Start from a direct customer entry so the collection's scroll position is absent.
    visit("/products/1")
    expect(page.locator(".gallery-thumbs button").first).to_have_attribute("aria-pressed", "true")
    expect(stage.locator("img")).to_have_js_property("complete", True)
    def capture(name):
        if width == 850:
            return
        image = page.screenshot()
        assert image.startswith(b"\x89PNG") and struct.unpack(">II", image[16:24]) == (width,height)
        assert page.evaluate("async data => { const img = new Image(); img.src = 'data:image/png;base64,' + data; await img.decode(); return img.naturalWidth; }", base64.b64encode(image).decode()) == width
        target = Path(os.environ.get("PDP_SCREENSHOT_DIR", WEB.parents[1] / "docs/pdp-review")) / name
        target.parent.mkdir(exist_ok=True, parents=True)
        target.write_bytes(image)
    assert page.evaluate("scrollY") == 0
    capture(f"pdp-default-{width}.png")
    if width <= 390:
        for selector in [".pdp-purchase > strong", ".sku-options", ".pdp-purchase input", ".pdp-purchase form button", ".spec-tiles", ".product-reference .product-card"]:
            page.locator(selector).first.scroll_into_view_if_needed()
            expect(page.locator(".copilot-trigger")).to_have_count(0)
        page.get_by_text("Reviews for product 1").scroll_into_view_if_needed()
        expect(page.locator(".copilot-trigger")).to_have_count(0)
    opener = page.get_by_role("button", name="Compare with ShopPilot")
    dialog = page.get_by_role("dialog")
    for close_key in ["Escape", "Close assistant"]:
        opener.focus()
        page.keyboard.press("Enter")
        expect(dialog).to_be_visible()
        count = dialog.locator("button:enabled, input:enabled, a[href]").count()
        for key in ["Tab", "Shift+Tab"]:
            for _ in range(count + 1):
                assert dialog.evaluate("el => el.contains(document.activeElement)")
                page.keyboard.press(key)
            assert dialog.evaluate("el => el.contains(document.activeElement)")
        if close_key == "Escape":
            page.keyboard.press(close_key)
        else:
            dialog.get_by_role("button", name=close_key).click()
        expect(dialog).to_have_count(0)
        expect(opener).to_be_focused()
    check_media(stage, obs, PHOTOS[0])
    expect(page.locator(".gallery-thumbs button")).to_have_count(5)
    page.locator(".gallery-thumbs button").last.click()
    check_media(stage, obs, PHOTOS[-1])
    page.get_by_label("Quantity", exact=True).fill("3")
    page.evaluate("window.scrollTo(0,0)")
    capture(f"pdp-{width}.png")
    page.locator(".sku-options a").first.focus()
    page.keyboard.press("Tab")
    expect(page.locator('.sku-options a[href="/products/2"]')).to_be_focused()
    page.keyboard.press("Enter")
    expect(page.locator("h1")).to_be_focused()
    expect(page.locator(".pdp-purchase > small")).to_contain_text(alb["sku"])
    expect(page.locator(".pdp-purchase > strong")).to_have_text("\u20b95,299")
    expect(page.locator("h1")).to_have_text(alb["name"])
    check_media(stage, alb, None)
    geometry(page, stage)
    expect(page.locator(".gallery-thumbs button")).to_have_count(0)
    purchase = page.locator(".pdp-purchase")
    expect(purchase.get_by_label("Quantity")).to_have_value("1")
    purchase.get_by_label("Quantity").fill("2")
    purchase.get_by_role("button", name="Add to cart").click()
    expect(purchase.get_by_role("status")).to_have_text("Added to cart")
    assert purchases == [{"product_id": 2, "quantity": 2}]
    expect(page.get_by_text("Reviews for product 2")).to_be_visible()
    solo = True
    alb.update(stock_quantity=0, image_url=None, gallery_images=[])
    visit("/products/2")
    check_media(stage, alb, None)
    expect(page.locator(".sku-options")).to_have_count(0)
    expect(purchase.get_by_role("button", name="Add to cart")).to_be_disabled()
    alb.update(stock_quantity=5, image_url=UPLOAD)
    visit("/products/2")
    check_media(stage, alb, API + UPLOAD)
    alb.update(image_url=PHOTOS[0], gallery_images=PHOTOS[1:])

    visit("/cart")
    rows = page.locator(".cart-item")
    for idx, image in enumerate([PHOTOS[0], None]):
        row = rows.nth(idx)
        box = row.locator(".cart-item-image")
        check_media(box, items[idx], image)
        geometry(page, box)
        expect(row).to_contain_text(items[idx]["name"])
        expect(row).to_contain_text(items[idx]["sku"])
        expect(row).to_contain_text("₹4,999 each" if idx == 0 else "\u20b95,299 each")
        expect(row.get_by_label("Qty")).to_have_value("2")
        expect(row.locator(".cart-line-total")).to_have_text("₹9,998" if idx == 0 else "\u20b910,598")
    rows.first.get_by_label("Qty").select_option("3")
    expect(rows.first.locator(".cart-line-total")).to_have_text("₹14,997")
    expect(page.get_by_role("link", name="Continue to checkout")).to_have_attribute("href", "/checkout")

    visit("/")
    art = page.locator(".campaign-art")
    check_media(art, obs, PHOTOS[0])
    size = geometry(page, art)
    expect(page.locator(".purchase-strip a")).to_have_attribute("href", "/products/1")

    def mount_alabaster():
        page.evaluate("async () => (await import('/tests/campaignFixture.tsx')).mountAlabasterCampaign()")
        expect(page.locator(".campaign h1")).to_have_text(alb["name"])

    mount_alabaster()
    check_media(art, alb, None)
    assert geometry(page, art) == size
    expect(page.locator(".purchase-strip a")).to_have_attribute("href", "/products/2")
    alb["image_url"] = UPLOAD
    visit("/cart")
    check_media(rows.last.locator(".cart-item-image"), alb, API + UPLOAD)
    visit("/")
    mount_alabaster()
    check_media(art, alb, API + UPLOAD)
    assert geometry(page, art) == size
    unavailable = True
    with page.expect_response(lambda r: "q=AUD-NOVA-001" in r.url and r.status == 503):
        visit("/")
    expect(art).to_have_text("Studio audio")
    expect(art.locator("img")).to_have_count(0)
    expect(page.locator(".purchase-strip")).to_have_count(0)
    assert geometry(page, art) == size
    assert not errors, errors
    page.close()
    print(f"PASS collection, detail, cart and campaign at {width} x {height}", flush=True)


if __name__ == "__main__":
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    origin = f"http://127.0.0.1:{port}"
    server = subprocess.Popen(["node", "node_modules/vite/bin/vite.js", "--host", "127.0.0.1",
                               "--port", str(port), "--strictPort"], cwd=WEB,
                              env={**os.environ, "VITE_API_URL": API}, stdout=subprocess.DEVNULL)
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel="msedge")
            for width, height in VIEWPORTS:
                exercise(browser, origin, width, height)
            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=10)
