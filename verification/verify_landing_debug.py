from playwright.sync_api import sync_playwright

def verify_landing():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to root...")
            page.goto("http://localhost:3000")

            print(f"Current URL: {page.url}")

            print("Waiting for redirection...")
            # Increased timeout to 60s
            try:
                page.wait_for_url("**/landing", timeout=60000)
                print(f"Redirected to: {page.url}")
            except Exception as e:
                print(f"Wait for URL failed: {e}")
                print(f"Final URL: {page.url}")

            # Take a screenshot regardless of redirection
            page.screenshot(path="verification/landing_page_debug.png", full_page=True)
            print("Screenshot taken")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_landing()
