from playwright.sync_api import Page, expect, sync_playwright

def verify_pricing_table(page: Page):

  # 1. Arrange: Go to the landing page.
  page.goto("http://localhost:3000/landing")

  # 2. Act: Scroll to the pricing section (it's at the bottom)
  pricing_header = page.get_by_text("Plany i Cennik")
  pricing_header.scroll_into_view_if_needed()

  # 3. Assert: Verify the translated footer text exists.
  expect(page.get_by_text("Informacje o zmianie planu:")).to_be_visible()
  expect(page.get_by_text("Przejście na wyższy plan:")).to_be_visible()
  expect(page.get_by_text("Przejście na niższy plan:")).to_be_visible()

  # 4. Screenshot: Capture the pricing table area.
  page.screenshot(path="/home/jules/verification/pricing_table.png", full_page=True)

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      verify_pricing_table(page)
    finally:
      browser.close()
