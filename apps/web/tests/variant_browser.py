"""Rendered Edge regressions with synthetic API responses and a private Vite process."""
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
VIEWPORTS = [(1440, 900), (1280, 800), (390, 844), (360, 800)]


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
    items = [obs, alb]
    quantity = 2
    unavailable = False

    def respond(route):
        nonlocal quantity
        url = urlsplit(route.request.url)
        path = url.path
        if path == UPLOAD:
            return route.fulfill(content_type="image/svg+xml", body='<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="ivory"/></svg>')
        if path.endswith("/auth/me"):
            data = dict(id=1, role="customer", full_name="Fixture", email="qa@example.invalid")
        elif "/cart" in path:
            if route.request.method == "PATCH":
                quantity = route.request.post_data_json["quantity"]
            data = dict(items=[dict(id=p["id"], product=p, quantity=quantity, product_id=p["id"]) for p in items],
                        item_count=2*quantity, subtotal=2*quantity*4999)
        elif path.endswith("/variants"):
            data = items
        elif path.endswith("/reviews"):
            return route.fulfill(status=503, json={"detail": "Fixture reviews unavailable"})
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
    cards = page.locator(".product-card")
    expect(cards).to_have_count(2)
    for idx, image in enumerate([PHOTOS[0], None]):
        box = cards.nth(idx).locator(".product-image-wrap")
        check_media(box, items[idx], image)
        geometry(page, box)
        expect(cards.nth(idx).get_by_role("button", name="Add to cart")).to_be_enabled()
    cards.first.locator(".product-image-wrap").click()
    stage = page.locator(".gallery-stage")
    check_media(stage, obs, PHOTOS[0])
    expect(page.locator(".gallery-thumbs button")).to_have_count(5)
    page.locator(".gallery-thumbs button").last.click()
    check_media(stage, obs, PHOTOS[-1])
    page.locator('.sku-options a[href="/products/2"]').click()
    expect(page.locator("h1")).to_have_text(alb["name"])
    check_media(stage, alb, None)
    geometry(page, stage)
    expect(page.locator(".gallery-thumbs button")).to_have_count(0)
    expect(page.get_by_role("button", name="Add to cart")).to_be_enabled()

    visit("/cart")
    rows = page.locator(".cart-item")
    for idx, image in enumerate([PHOTOS[0], None]):
        row = rows.nth(idx)
        box = row.locator(".cart-item-image")
        check_media(box, items[idx], image)
        geometry(page, box)
        expect(row).to_contain_text(items[idx]["name"])
        expect(row).to_contain_text(items[idx]["sku"])
        expect(row).to_contain_text("₹4,999 each")
        expect(row.get_by_label("Qty")).to_have_value("2")
        expect(row.locator(".cart-line-total")).to_have_text("₹9,998")
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
