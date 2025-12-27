from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Wait for server to start
        time.sleep(5)
        
        try:
            print("Navigating to dashboard inspections...")
            response = page.goto("http://localhost:3000/dashboard/inspections")
            print(f"Status inspections: {response.status}")
            page.screenshot(path="verification/inspections_schema_check.png")
            
            print("Navigating to dashboard apiaries...")
            response = page.goto("http://localhost:3000/dashboard/apiaries")
            print(f"Status apiaries: {response.status}")
            page.screenshot(path="verification/apiaries_schema_check.png")
            
            print("Screenshots taken.")
            
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
