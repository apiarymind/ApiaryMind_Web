import re
from playwright.sync_api import sync_playwright

def verify_landing_content():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Navigate to root (which redirects to landing logic)
        page.goto("http://localhost:3000/")
        page.wait_for_timeout(2000) # Wait for render

        content = page.content()
        
        # Check for specific text
        if "System v1.0 Gotowy" in content:
            print("SUCCESS: Found 'System v1.0 Gotowy'")
        else:
            print("FAILURE: Did not find 'System v1.0 Gotowy'")

        if "Otwórz Panel" in content:
            print("SUCCESS: Found 'Otwórz Panel'")
        else:
            print("FAILURE: Did not find 'Otwórz Panel'")

        # Check for single header
        # The global header is <header>, usually. Let's count them.
        headers = page.locator("header").count()
        print(f"INFO: Found {headers} <header> elements.")
        
        if headers == 1:
            print("SUCCESS: Exactly one <header> found.")
        elif headers == 0:
            print("WARNING: No <header> found (Layout issue?).")
        else:
            print("FAILURE: More than one <header> found (Double Header bug!).")

        # Check for Nav inside Main (The old bug often had a nav inside the hero)
        navs_in_main = page.locator("main nav").count()
        if navs_in_main == 0:
             print("SUCCESS: No <nav> found inside <main>.")
        else:
             print(f"FAILURE: Found {navs_in_main} <nav> elements inside <main>.")

        page.screenshot(path="verification/landing_verification.png", full_page=True)
        print("Screenshot saved to verification/landing_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_landing_content()
