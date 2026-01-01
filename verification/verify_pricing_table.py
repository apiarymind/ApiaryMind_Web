from playwright.sync_api import sync_playwright

def verify_pricing_table():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # Assumes server is running at localhost:3000
            page.goto("http://localhost:3000")
            
            # Wait for the pricing table
            page.wait_for_selector("text=Plany i Cennik")
            
            # Verify the new Legend text
            # Looking for key phrase "Scoring to ocena wartości hodowlanej"
            # Using a more resilient selector or text matching
            text_found = page.get_by_text("Scoring to ocena wartości hodowlanej matek (Miodność, Łagodność, Rojliwość, Zimowla)").is_visible()
            if text_found:
                print("Legend text found successfully.")
            else:
                print("ERROR: Legend text NOT found.")
                
            # Take a screenshot in Light Mode
            page.screenshot(path="verification/pricing_table_final.png", full_page=True)
            print("Screenshot saved to verification/pricing_table_final.png")
            
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_pricing_table()