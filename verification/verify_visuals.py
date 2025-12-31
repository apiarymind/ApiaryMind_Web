from playwright.sync_api import sync_playwright, expect
import time

def verify_visual_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to landing page
        page.goto("http://localhost:3000")

        # Wait for hydration
        page.wait_for_timeout(3000)

        # 1. Verify Header Branding
        # The branding link is the first link in the header that href='/', or check for the image child
        brand_link = page.locator("header a[href='/']").first

        # Check structure: Apiary span -> img -> Mind span
        branding_html = brand_link.inner_html()
        print("Branding HTML:", branding_html)

        if '<span class="text-amber-950 dark:text-white">Apiary</span>' in branding_html:
             print("SUCCESS: Apiary text found with correct classes.")
        else:
             print("FAILURE: Apiary text incorrect.")

        if '<img src="/assets/bee-3d-icon.png"' in branding_html:
             print("SUCCESS: Logo image found.")
        else:
             print("FAILURE: Logo image missing.")

        if '<span class="text-amber-500">Mind</span>' in branding_html:
             print("SUCCESS: Mind text found with correct classes.")
        else:
             print("FAILURE: Mind text incorrect.")

        # Check order by index
        apiary_idx = branding_html.find('Apiary</span>')
        img_idx = branding_html.find('<img')
        mind_idx = branding_html.find('Mind</span>')

        if apiary_idx != -1 and img_idx != -1 and mind_idx != -1 and apiary_idx < img_idx < mind_idx:
            print("SUCCESS: Branding order is correct (Apiary -> Logo -> Mind).")
        else:
            print(f"FAILURE: Branding order incorrect or missing. Indices: Apiary={apiary_idx}, Img={img_idx}, Mind={mind_idx}")

        # 2. Verify AI Chat Button
        # It's fixed bottom-6 right-6
        chat_btn = page.locator("button[title='Asystent AI']")
        expect(chat_btn).to_be_visible()

        # Check classes for glassmorphism
        class_attr = chat_btn.get_attribute("class")
        print("Chat Button Classes:", class_attr)

        required_classes = [
            "rounded-full",
            "backdrop-blur-md",
            "bg-white/60",
            "dark:bg-black/40"
        ]

        for cls in required_classes:
            if cls in class_attr:
                print(f"SUCCESS: Chat button has class '{cls}'")
            else:
                print(f"FAILURE: Chat button missing class '{cls}'")

        # Take screenshot of the whole page
        page.screenshot(path="verification/visual_update_check.png")
        print("Screenshot saved to verification/visual_update_check.png")

        browser.close()

if __name__ == "__main__":
    verify_visual_changes()
