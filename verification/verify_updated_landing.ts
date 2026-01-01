
import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Note: Using port 3003 as established in previous steps
  console.log("Navigating to http://localhost:3003/ ...");
  await page.goto('http://localhost:3003/');
  
  // Verify Hero Text
  console.log("Checking Hero Text...");
  await page.waitForSelector('text=Przyszłość Twojej Pasieki');
  await page.waitForSelector('text=Zaczyna się Dzisiaj');
  console.log("Hero Text verified.");

  // Verify Features
  console.log("Checking Features...");
  await page.waitForSelector('text=Sterowanie Głosem');
  await page.waitForSelector('text=Strażnik Karencji');
  await page.waitForSelector('text=AI Scoring');
  await page.waitForSelector('text=Smoke Theme');
  console.log("Features verified.");

  // Verify Beta Promo
  console.log("Checking Beta Promo Section...");
  await page.waitForSelector('text=Zostań Pionierem ApiaryMind');
  await page.waitForSelector('text=2 LATA');
  await page.waitForSelector('text=Subskrypcji PRO+ Za Darmo');
  console.log("Beta Promo verified.");

  // Take screenshot
  await page.screenshot({ path: 'verification/landing_page_updated.png', fullPage: true });
  console.log("Screenshot saved to verification/landing_page_updated.png");

  await browser.close();
}

verify().catch(console.error);
