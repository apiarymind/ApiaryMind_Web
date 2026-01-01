
import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log("Navigating to http://localhost:3003/ ...");
  await page.goto('http://localhost:3003/');
  
  // Wait for the Hero section
  console.log("Waiting for 'Dołącz do Beta testów' button...");
  await page.waitForSelector('text=Dołącz do Beta testów');
  console.log("Hero section verified.");

  // Wait for the Pricing section
  console.log("Waiting for 'Cennik' text...");
  await page.waitForSelector('text=Cennik');
  console.log("Pricing section verified.");

  // Take a full page screenshot
  await page.screenshot({ path: 'verification/landing_page_complete.png', fullPage: true });
  console.log("Screenshot saved to verification/landing_page_complete.png");

  await browser.close();
}

verify().catch(console.error);
