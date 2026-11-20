from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import expect


def exercise_admin_orders(browser, origin, api, width, height):
    page = browser.new_page(viewport={"width": width, "height": height})
    page.add_init_script("sessionStorage.setItem('shoppilot_access_token','fixture')")
    role = "admin"
    order = dict(id=18, status="PAID", receipt_number="SP-18", payment_method="card", currency="INR",
                 created_at="2026-01-01T10:00:00Z", total_amount="20", subtotal_amount="20",
                 shipping_cost="0", discount_amount="0", shipping_address={"recipient_name": "Test Buyer"},
                 items=[dict(id=1, product_name="Headphones", sku="AUDIO", quantity=2, line_total="20")])
    fail = True

    def respond(route):
        nonlocal fail
        url = urlsplit(route.request.url)
        if url.path.endswith("/auth/me"):
            data = dict(id=1, role=role, full_name="Test Buyer", email="qa@example.invalid")
        elif url.path.endswith("/18/status"):
            assert route.request.method == "PATCH" and route.request.post_data_json == {"status": "PROCESSING"}
            if fail:
                fail = False
                return route.fulfill(status=409, json={"detail": "Update conflict"})
            order["status"] = "PROCESSING"
            data = order
        elif url.path.endswith("/orders"):
            requested = parse_qs(url.query).get("status", [order["status"]])[0]
            matches = [order] if requested == order["status"] else []
            data = dict(items=matches, total=len(matches))
        elif "/products" in url.path:
            data = dict(items=[], total=0)
        else:
            data = []
        route.fulfill(json=data)

    page.route(api + "/**", respond)
    page.goto(origin + "/admin/orders", wait_until="domcontentloaded")
    expect(page.get_by_text("Test Buyer", exact=True).last).to_be_visible()
    select = page.get_by_label("Order status")
    select.select_option("SHIPPED")
    expect(page.get_by_text("No orders on this page.")).to_be_visible()
    select.select_option("PAID")
    action = page.get_by_role("button", name="Mark as PROCESSING")
    action.click()
    expect(page.get_by_role("alert")).to_have_text("Update conflict")
    action.click()
    expect(page.get_by_text("Order #18 updated to PROCESSING.")).to_be_visible()
    expect(page.get_by_text("No orders on this page.")).to_be_visible()
    select.select_option("PROCESSING")
    expect(page.get_by_role("button", name="Mark as SHIPPED")).to_be_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    role = "customer"
    page.goto(origin + "/admin/orders", wait_until="domcontentloaded")
    expect(page).to_have_url(origin + "/")
    expect(page.get_by_role("link", name="Fulfillment")).to_have_count(0)
    page.goto(origin + "/orders", wait_until="domcontentloaded")
    expect(page.get_by_role("button", name="Print receipt")).to_be_visible()
    expect(page.get_by_text("Simulate next stage")).to_have_count(0)
    expect(page.locator(".order-status")).to_have_text("PROCESSING")
    page.close()
    print(f"PASS fulfillment at {width} x {height}", flush=True)
