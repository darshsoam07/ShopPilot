"""Edge checkout flows against a disposable migrated SQLite database."""
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import tempfile
import threading
import time
from urllib.request import urlopen

from playwright.sync_api import expect, sync_playwright
from variant_browser import VIEWPORTS, WEB

API_DIR = WEB.parent / "api"


def port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def wait_for(url):
    for _ in range(100):
        try:
            with urlopen(url, timeout=1):
                return
        except OSError:
            time.sleep(.1)
    raise RuntimeError(f"Server unavailable at {url}")


def run(browser, web, api, width, height):
    page = browser.new_page(viewport={"width": width, "height": height})
    page.route("https://**/*", lambda route: route.abort())
    credentials = {"full_name":"Demo Buyer", "email":f"qa{width}@example.com", "password":secrets.token_urlsafe(20)}
    assert page.request.post(api+"/auth/register", data=credentials).ok
    token = page.request.post(api+"/auth/login", data=credentials).json()["access_token"]
    headers = {"Authorization":"Bearer "+token}
    page.add_init_script(f"sessionStorage.setItem('shoppilot_access_token','{token}')")
    page.goto(web+"/account/addresses")
    fields = {"Recipient name":"Demo Buyer", "Phone number":"1234567890", "Street address":"12 Test Street",
              "City":"Delhi", "Postal code":"110001", "Country":"India"}
    def fill():
        for label,value in fields.items():
            page.get_by_label(label, exact=True).fill(value)
    fill()
    page.get_by_role("button",name="Save address").click()
    page.get_by_role("button",name="Set default").click()
    expect(page.locator("article strong")).to_have_text("Default address")
    page.get_by_role("button",name="Edit",exact=True).click()
    page.get_by_label("City",exact=True).fill("Mumbai")
    page.get_by_role("button",name="Save address").click()
    expect(page.locator("address")).to_contain_text("Mumbai")

    keys = []
    page.on("request", lambda r: keys.append(r.post_data_json["idempotency_key"]) if r.url.endswith("/orders/checkout") else None)
    product = page.request.get(api+"/products").json()["items"][0]
    for method in ["card","cod"]:
        assert page.request.post(api+"/cart/items", headers=headers, data={"product_id":product["id"],"quantity":1}).ok
        page.goto(web+"/checkout")
        expect(page.get_by_role("combobox", name="Delivery address", exact=True)).to_have_value(str(page.request.get(api+"/addresses",headers=headers).json()[0]["id"]))
        if method == "cod":
            page.get_by_role("combobox", name="Delivery address", exact=True).select_option("")
            fill()
            page.get_by_label("Save this delivery address").check()
        page.get_by_role("button",name="Continue to payment").click()
        page.get_by_role("combobox", name="Payment method", exact=True).select_option(method)
        if method == "card":
            page.get_by_role("combobox", name="Demo gateway result", exact=True).select_option("decline")
            page.get_by_role("button",name="Review order").click()
            page.get_by_role("button",name="Place order").click()
            expect(page.get_by_role("alert")).to_contain_text("declined")
            page.get_by_role("button",name="Back").click()
            page.get_by_role("combobox", name="Demo gateway result", exact=True).select_option("success")
        page.get_by_role("button",name="Review order").click()
        if method == "card":
            def lose_response(route):
                assert route.fetch().ok
                route.abort()
            page.route("**/orders/checkout", lose_response, times=1)
            page.get_by_role("button",name="Place order").click()
            expect(page.get_by_role("alert")).to_be_visible()
        page.get_by_role("button",name="Place order").click()
        expected = "pending" if method == "cod" else "succeeded"
        expect(page.get_by_text(f"Payment {expected}",exact=False).first).to_contain_text("PAY-")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    assert len(keys)==4 and keys[0]!=keys[1] and keys[1]==keys[2] and keys[2]!=keys[3]
    assert len(page.request.get(api+"/payments",headers=headers).json())==3
    page.goto(web+"/account/addresses")
    expect(page.locator("article")).to_have_count(2)
    page.once("dialog", lambda d:d.accept())
    page.get_by_role("button",name="Delete").last.click()
    expect(page.locator("article")).to_have_count(1)
    from after_sales_browser import exercise_after_sales
    from app.db.session import engine
    exercise_after_sales(page, web, api, headers, engine)
    page.close()
    print(f"PASS address book and payments {width} x {height}",flush=True)


if __name__ == "__main__":
    web = f"http://127.0.0.1:{port()}"
    api = f"http://127.0.0.1:{port()}"
    with tempfile.TemporaryDirectory() as tmp:
        env = {**os.environ, "DATABASE_URL":"sqlite:///"+(Path(tmp)/"test.db").as_posix(),
               "SECRET_KEY":secrets.token_hex(32),"MEDIA_DIR":tmp,"CORS_ORIGINS":f'["{web}"]'}
        for module,args in [("alembic",["upgrade","head"]),("scripts.seed_products",[])]:
            subprocess.run([sys.executable,"-m",module,*args],cwd=API_DIR,env=env,check=True)
        import uvicorn
        os.environ.update(env)
        sys.path.insert(0, str(API_DIR))
        from app.db.session import engine
        backend = uvicorn.Server(uvicorn.Config("app.main:app", host="127.0.0.1", port=int(api.split(":")[-1]), log_level="error"))
        thread = threading.Thread(target=backend.run)
        thread.start()
        frontend = subprocess.Popen(["node","node_modules/vite/bin/vite.js","--host","127.0.0.1","--port",web.split(":")[-1],"--strictPort"],cwd=WEB,env={**os.environ,"VITE_API_URL":api},stdout=subprocess.DEVNULL)
        try:
            wait_for(api+"/readyz")
            wait_for(web)
            with sync_playwright() as pw:
                browser=pw.chromium.launch(channel="msedge")
                for width,height in VIEWPORTS:
                    run(browser,web,api+"/api/v1",width,height)
                browser.close()
        finally:
            frontend.terminate()
            frontend.wait(timeout=10)
            backend.should_exit = True
            thread.join(10)
            engine.dispose()
