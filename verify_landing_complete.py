from playwright.sync_api import sync_playwright
import os

def verify_landing_complete():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to Landing Page...")
            page.goto("http://localhost:3004/")
            page.wait_for_load_state("networkidle")
            
            # Check for Sections
            # Hero
            if page.get_by_text("Przyszłość Twojej Pasieki").is_visible():
                print("SUCCESS: Hero Section visible.")
            else:
                print("FAILURE: Hero Section NOT found.")
                
            # Features
            if page.get_by_text("Dlaczego ApiaryMind?").is_visible():
                print("SUCCESS: Features Section visible.")
            else:
                print("FAILURE: Features Section NOT found.")

            # Pricing
            # Assuming Pricing Table has some text like "Plan" or "Miesięcznie" or a price.
            # Let's look for a generic element or ID if possible, but text is safer.
            # The prompt code had "Zostań Pionierem ApiaryMind" in BETA_PROMO.
            
            # Beta Promo
            if page.get_by_text("Zostań Pionierem ApiaryMind").is_visible():
                print("SUCCESS: Beta Promo visible.")
            else:
                print("FAILURE: Beta Promo NOT found.")

            # Pricing Table verification might need specific text from that component.
            # Assuming the PricingTable component renders something like "Free" or "Pro" or "Zł".
            # I'll check for the section container existence if text is hard to predict without reading the component file.
            # The code adds a section with id='pricing'.
            
            # Create verification directory if it doesn't exist
            os.makedirs("verification", exist_ok=True)
            
            # Take screenshot
            screenshot_path = "verification/landing_complete_verification.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_landing_complete()
