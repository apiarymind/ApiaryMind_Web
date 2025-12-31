from playwright.sync_api import sync_playwright

def verify_landing():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the root, which should redirect to /landing
            page.goto("http://localhost:3000")
            page.wait_for_url("**/landing")

            # Check for the specific content we added
            page.wait_for_selector("text=System v1.0 Gotowy")
            page.wait_for_selector("text=Twoja Pasieka")
            page.wait_for_selector("text=Pod Kontrolą")

            # Take a screenshot
            page.screenshot(path="verification/landing_page.png", full_page=True)
            print("Screenshot taken successfully")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_landing()
