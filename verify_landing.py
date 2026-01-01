from playwright.sync_api import sync_playwright
import os

def verify_landing():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to Landing Page...")
            # Wait for server to be ready
            page.goto("http://localhost:3004/")
            page.wait_for_load_state("networkidle")
            
            # Check for the correct button
            beta_button = page.get_by_text("Dołącz do Beta testów")
            if beta_button.is_visible():
                print("SUCCESS: 'Dołącz do Beta testów' button is visible.")
            else:
                print("FAILURE: 'Dołącz do Beta testów' button NOT found.")
                
            # Check for absence of incorrect buttons
            panel_button = page.get_by_text("Otwórz Panel")
            if not panel_button.is_visible():
                print("SUCCESS: 'Otwórz Panel' button is correctly ABSENT.")
            else:
                print("FAILURE: 'Otwórz Panel' button IS visible (Regression!).")
                
            # Check for Glass Tile elements (e.g., System v1.0 Gotowy)
            system_badge = page.get_by_text("System v1.0 Gotowy")
            if system_badge.is_visible():
                print("SUCCESS: 'System v1.0 Gotowy' badge is visible.")
            else:
                print("FAILURE: 'System v1.0 Gotowy' badge NOT found.")

            # Create verification directory if it doesn't exist
            os.makedirs("verification", exist_ok=True)
            
            # Take screenshot
            screenshot_path = "verification/landing_verification.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_landing()
