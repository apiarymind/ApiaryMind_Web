from playwright.sync_api import Page, expect, sync_playwright

def verify_landing_page_mobile(page: Page):
    # Navigate to the landing page
    # Note: server is running on port 3001 according to logs
    page.goto("http://localhost:3001/landing")

    # Wait for the hero section to be visible
    expect(page.get_by_text("System v1.0 Gotowy")).to_be_visible(timeout=30000)

    # Take a full page screenshot
    page.screenshot(path="/home/jules/verification/landing_mobile.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        # Use a mobile viewport (iPhone 12/13/14 Pro)
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()
        try:
            verify_landing_page_mobile(page)
        finally:
            browser.close()
