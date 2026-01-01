from playwright.sync_api import sync_playwright

def verify_beta_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the beta page
        page.goto("http://localhost:3004/beta")

        # Check for key elements
        page.wait_for_selector("text=REKRUTACJA OTWARTA")
        page.wait_for_selector("text=Plan PRO+ Za Darmo")
        page.wait_for_selector("text=Poszukiwane profile pasiek")

        # Fill out the form partially to check inputs
        page.fill("input[name='firstName']", "Test")
        page.fill("input[name='lastName']", "User")

        # Take a screenshot
        page.screenshot(path="beta_page_verification.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_beta_page()
