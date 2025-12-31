from playwright.sync_api import sync_playwright

def verify_light_dark_landing():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:3000/landing...")
            page.goto("http://localhost:3000/landing", timeout=10000)

            # Wait for key elements
            page.wait_for_selector("text=System v1.0 Gotowy", timeout=5000)

            content = page.content()

            # 1. Verify "Dołącz do Beta testów" presence
            if "Dołącz do Beta testów" in content:
                print("SUCCESS: Beta button found.")
            else:
                print("FAILURE: Beta button NOT found.")

            # 2. Verify absence of "Logowanie" or "Otwórz Panel" in Hero section container
            # We look specifically in the hero section container text, but searching global content is a good proxy if they don't appear elsewhere.
            # Actually, "Logowanie" is in the Header (layout), so we should check the specific Hero container.
            # The Hero container has classes `relative pt-32 ...`
            hero_locator = page.locator("div.relative.pt-32")
            if hero_locator.count() > 0:
                 hero_text = hero_locator.inner_text()
                 if "Logowanie" in hero_text or "Otwórz Panel" in hero_text:
                     print(f"FAILURE: Unexpected buttons found in Hero: {hero_text}")
                 else:
                     print("SUCCESS: Old buttons removed from Hero.")
            else:
                 print("WARNING: Hero locator not found.")

            # 3. Verify CSS Classes for Adaptive Design
            # We look for `bg-white/60` and `dark:bg-black/40` on the glass tile
            glass_tile = page.locator("div.bg-white\\/60.dark\\:bg-black\\/40")
            if glass_tile.count() > 0:
                print("SUCCESS: Adaptive glass tile classes found.")
            else:
                # Debugging: print classes of the likely element
                print("FAILURE: Adaptive glass tile classes NOT found.")

            # Take screenshot
            page.screenshot(path="verification/light_dark_check.png", full_page=True)
            print("Screenshot saved to verification/light_dark_check.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_ld.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_light_dark_landing()
