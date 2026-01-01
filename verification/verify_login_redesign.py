from playwright.sync_api import sync_playwright

def verify_login_redesign():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Verify Dark Mode only as requested "Premium Dark"
        context = browser.new_context(color_scheme='dark')
        page = context.new_page()

        print("Navigating to login page...")
        # Use 3001 as previously established
        page.goto("http://localhost:3001/login")

        # Wait for content to load
        page.wait_for_selector("text=Witamy Ponownie")

        # Verify specific style elements
        # 1. Background Gradient - checking if main container has the gradient class is hard via computed style,
        # but we can visually inspect or check for class existence if we could inspect DOM.
        # Playwright can check classes.

        # Check for new input styling (gray-800/100 text)
        email_input = page.locator("input[type='email']")
        # Focus on input to check focus ring color (hard to assert programmatically without screenshot but we can try)
        email_input.click()

        print("Taking screenshot of redesigned Login Page...")
        page.screenshot(path="verification/login_premium_dark.png")

        browser.close()

if __name__ == "__main__":
    verify_login_redesign()
