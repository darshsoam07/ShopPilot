import json, os, socket, subprocess, time
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import expect, sync_playwright

WEB = Path(__file__).resolve().parents[1]
API = "http://fixture.invalid"
SHOTS = Path(os.environ.get("SHOTS", "/tmp/shots"))
PHOTOS = ["/demo/nova.jpg", *[f"/demo/nova-detail-{i}.jpg" for i in range(1, 5)]]

def product(i, sku, finish, price):
    return dict(id=i, sku=sku, name=f"Nova Wireless Headphones · {finish}", brand="Nova", category="Audio",
                specifications={"Finish": finish, "Configuration": "Standard", "Battery": "40 hours", "Weight": "250 g"},
                price=price, stock_quantity=5, description="Wireless over-ear headphones for long sessions.",
                image_url=PHOTOS[0], gallery_images=PHOTOS[1:], family="nova", rating="4.5", review_count=2)

def run(browser, origin, w, h, tag):
    page = browser.new_page(viewport={"width": w, "height": h}, reduced_motion="reduce")
    errors, warnings = [], []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: warnings.append(m.text) if m.type in ("error", "warning") else None)
    page.add_init_script("sessionStorage.setItem('shoppilot_access_token','fixture')")
    items = [product(1, "AUD-NOVA-001", "Obsidian", "4999.00"), product(2, "AUD-NOVA-ALB", "Alabaster", "5299.00")]
    placed = {"n": 0}
    posted = []
    reviews = dict(reviews=[dict(id=1, rating=5, title="Great", comment="Comfortable for long sessions.", author_name="Asha",
                                 is_verified_purchase=True, created_at="2026-10-01T10:00:00Z"),
                            dict(id=2, rating=4, title="Solid", comment="Good battery life overall.", author_name="Ravi",
                                 is_verified_purchase=True, created_at="2026-10-02T10:00:00Z")],
                   can_review=True, digest=dict(total_reviews=2, average_rating=4.5, verified_count=2, sentiment_label="Mostly positive",
                   summary="Customers praise comfort and battery life.", pros=["Comfort", "Battery"], cons=["Price"]))

    def respond(route):
        url = urlsplit(route.request.url); path = url.path; m = route.request.method
        if path.endswith("/auth/me"): data = dict(id=1, role="customer", full_name="Asha Rao", email="a@example.invalid")
        elif path.endswith("/orders/checkout"):
            placed["n"] += 1
            if placed["n"] == 1:
                return route.fulfill(status=402, json={"detail": "Payment declined by the demo gateway"})
            return route.fulfill(json=dict(id=7))
        elif path.endswith("/addresses"):
            if m == "POST":
                posted.append(route.request.post_data_json); data = dict(id=3, details=posted[-1]["details"], is_default=True)
            else: data = []
        elif "/cart" in path:
            data = dict(items=[dict(id=1, product=items[0], quantity=2, product_id=1)], item_count=2, subtotal="9998.00")
        elif path.endswith("/variants"): data = items
        elif path.endswith("/reviews"): data = reviews
        elif path.endswith("/products/1") or path.endswith("/products/2"): data = items[int(path[-1]) - 1]
        elif "/products" in path: data = dict(items=items, total=2, categories={"Audio": 2}, page=1, page_size=12)
        else: data = []
        route.fulfill(json=data)
    page.route(API + "/**", respond)
    def visit(p): page.goto(origin + p); page.wait_for_load_state("networkidle")
    def noscroll(): assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (page.url, w)

    visit("/"); noscroll(); page.screenshot(path=SHOTS / f"{tag}-home.png")
    visit("/products"); noscroll(); page.screenshot(path=SHOTS / f"{tag}-products.png")
    visit("/products/1"); noscroll()
    expect(page.locator(".sku-options a")).to_have_count(2)
    page.screenshot(path=SHOTS / f"{tag}-pdp.png")
    page.locator(".reviews").scroll_into_view_if_needed(); page.wait_for_timeout(700)
    page.screenshot(path=SHOTS / f"{tag}-pdp-reviews.png")
    visit("/checkout"); noscroll()
    expect(page.get_by_role("heading", name="Delivery details")).to_be_visible()
    cur = page.locator("[aria-current=step]"); expect(cur).to_have_count(1); expect(cur).to_contain_text("Shipping")
    for label, val in [("Recipient name", "Asha Rao"), ("Street address", "12 Marine Drive"), ("City", "Mumbai"), ("Postal code", "400001"), ("Phone number", "9876543210")]:
        page.get_by_label(label, exact=True).fill(val)
    expect(page.get_by_role("combobox", name="Delivery address", exact=True)).to_be_visible()
    page.get_by_label("Save this delivery address").check()
    page.get_by_role("radio", name="GLS").check()
    page.screenshot(path=SHOTS / f"{tag}-checkout-1.png")
    page.get_by_role("button", name="Continue to payment").click()
    expect(page.get_by_role("combobox", name="Payment method", exact=True)).to_be_visible()
    expect(page.locator("[aria-current=step]")).to_contain_text("Payment")
    page.get_by_role("combobox", name="Payment method", exact=True).select_option("card")
    page.get_by_role("combobox", name="Demo gateway result", exact=True).select_option("decline")
    page.screenshot(path=SHOTS / f"{tag}-checkout-2.png")
    page.get_by_role("button", name="Review order").click()
    page.get_by_role("button", name="Place order").click()
    expect(page.get_by_role("alert")).to_contain_text("declined")
    page.screenshot(path=SHOTS / f"{tag}-checkout-3.png")
    page.get_by_role("button", name="Back").click()
    page.get_by_role("combobox", name="Demo gateway result", exact=True).select_option("success")
    page.get_by_role("button", name="Review order").click()
    page.get_by_role("button", name="Place order").click()
    page.wait_for_url("**/orders?placed=7"); noscroll()
    assert not errors, errors
    print('  console:', sorted(set(t[:120] for t in warnings)), flush=True)
    dupes = [t for t in warnings if "same key" in t]
    assert not dupes, dupes
    page.close()
    print(f"PASS checkout smoke at {w}x{h}; console warnings/errors: {len(warnings)}", flush=True)

if __name__ == "__main__":
    with socket.socket() as s: s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]
    origin = f"http://127.0.0.1:{port}"
    server = subprocess.Popen(["node", "node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", str(port), "--strictPort"], cwd=WEB, env={**os.environ, "VITE_API_URL": API}, stdout=subprocess.DEVNULL)
    try:
        for _ in range(300):
            try: socket.create_connection(("127.0.0.1", port), timeout=1).close(); break
            except OSError: time.sleep(0.1)
        with sync_playwright() as p:
            b = p.chromium.launch(channel="chrome")
            for w, h, tag in [(1440, 900, "desktop"), (390, 844, "mobile"), (360, 800, "small")]: run(b, origin, w, h, tag)
            b.close()
    finally:
        server.terminate(); server.wait(timeout=10)
