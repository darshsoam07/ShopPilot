"""After-sales flows using the address suite's disposable API and two placed orders."""
import secrets

from playwright.sync_api import expect
from sqlalchemy import update

from app.models.user import User


def exercise_after_sales(page, web, api, headers, engine):
    orders = page.request.get(api + "/orders", headers=headers).json()["items"]
    card = next(row for row in orders if row["payment_method"] == "card")
    cod = next(row for row in orders if row["payment_method"] == "cod")
    credentials = {"email": secrets.token_hex(8) + "@example.com", "full_name": "Demo Manager",
                   "password": secrets.token_urlsafe(20)}
    assert page.request.post(api + "/auth/register", data=credentials).ok
    with engine.begin() as conn:
        conn.execute(update(User).where(User.email == credentials["email"]).values(role="admin"))
    token = page.request.post(api + "/auth/login", data=credentials).json()["access_token"]
    admin = page.context.browser.new_page(viewport=page.viewport_size)
    admin.route("https://**/*", lambda route: route.abort())
    admin.add_init_script(f"sessionStorage.setItem('shoppilot_access_token','{token}')")
    auth = {"Authorization": "Bearer " + token}
    def fulfill(status):
        assert admin.request.patch(f"{api}/admin/orders/{cod['id']}/status", headers=auth,
                                   data={"status": status}).ok
    fulfill("SHIPPED")
    page.goto(web + "/orders")
    def article(order):
        return page.locator("article").filter(has=page.get_by_text(f"ORDER #{order['id']}", exact=True))
    expect(article(cod).get_by_role("button", name="Request return")).to_have_count(0)
    expect(article(cod).get_by_role("button", name="Request cancellation")).to_have_count(0)
    article(card).get_by_label("Reason for cancellation").fill("Ordered twice")
    article(card).get_by_role("button", name="Request cancellation").click()
    expect(article(card)).to_contain_text("REQUESTED")
    admin.goto(web + "/admin/after-sales")
    def entry(order):
        return admin.locator("article").filter(has=admin.get_by_role("heading", name=f"Order #{order['id']}", exact=True))
    entry(card).get_by_role("button", name="Approve").click()
    expect(entry(card)).to_contain_text("Simulated refund COMPLETED")
    fulfill("DELIVERED")
    page.reload()
    expect(article(card)).to_contain_text("Simulated refund COMPLETED")
    article(cod).get_by_label("Reason for return").fill("Poor fit")
    article(cod).get_by_role("button", name="Request return").click()
    expect(article(cod)).to_contain_text("REQUESTED")
    admin.get_by_label("Request queue").select_option("return")
    for action in ("Approve", "Mark received", "Complete return"):
        entry(cod).get_by_role("button", name=action).click()
    expect(entry(cod)).to_contain_text("COMPLETED")
    page.reload()
    expect(article(cod)).to_contain_text("return · COMPLETED")
    expect(article(cod)).not_to_contain_text("Simulated refund")
    for screen in (admin, page):
        assert screen.evaluate("document.documentElement.scrollWidth <= innerWidth")
    admin.close()
