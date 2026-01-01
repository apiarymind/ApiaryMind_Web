from playwright.sync_api import sync_playwright

def verify_login_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a context to set color scheme
        context_light = browser.new_context(color_scheme='light')
        page_light = context_light.new_page()

        print("Navigating to login page (Light Mode)...")
        # Assuming port 3001 as 3000 was taken
        page_light.goto("http://localhost:3001/login")

        # Wait for content to load
        page_light.wait_for_selector("text=Witamy Ponownie")

        print("Taking screenshot (Light Mode)...")
        page_light.screenshot(path="verification/login_light.png")

        context_dark = browser.new_context(color_scheme='dark')
        page_dark = context_dark.new_page()

        print("Navigating to login page (Dark Mode)...")
        page_dark.goto("http://localhost:3001/login")

        # Wait for content
        page_dark.wait_for_selector("text=Witamy Ponownie")

        print("Taking screenshot (Dark Mode)...")
        page_dark.screenshot(path="verification/login_dark.png")

        browser.close()

if __name__ == "__main__":
    verify_login_page()
