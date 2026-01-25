from playwright.sync_api import sync_playwright
import os

def test_login_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Using port 3001 as per server logs
            page.goto("http://localhost:3001/login", timeout=60000)
            page.wait_for_selector('h1, h2, form, button', timeout=10000)
            page.screenshot(path="/home/jules/verification/login.png")
            print("Login page loaded successfully.")
        except Exception as e:
            print(f"Error loading login page: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    os.makedirs("/home/jules/verification", exist_ok=True)
    test_login_load()
