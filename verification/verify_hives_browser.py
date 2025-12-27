from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Wait for server to start
        time.sleep(5)

        try:
            print("Navigating to dashboard hives...")
            response = page.goto("http://localhost:3000/dashboard/hives")
            print(f"Status: {response.status}")

            page.screenshot(path="verification/hives_browser.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
