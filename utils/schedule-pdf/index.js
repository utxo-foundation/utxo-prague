const puppeteer = require('puppeteer');
const path = require('path');

const local = process.argv[2] || false;

const outputDir = '../../dist/22/pdf/'
const baseUrl = local ? 'http://localhost:3000' : 'https://utxo.cz'

async function makePdf (browser, item) {

  const url = baseUrl + item.url
  console.log(`Opening page '${url}':`)

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" })
  const fn = path.resolve(outputDir, `${item.id}.pdf`)
  await page.pdf({
    path: fn,
    format: item.format || 'a4',
    scale: 0.7,
    landscape: true,
    printBackground: true

  });
  console.log(`PDF saved: ${fn}`)
  await page.close()
  return true
}

async function run () {

  const browser = await puppeteer.launch();

  const items = [
    { id: 'sobota', url: '/program?time=0', format: 'a3' },
    { id: 'sobota-party', url: '/program?time=1', format: 'a4' },
    { id: 'nedele', url: '/program?time=2', format: 'a3' }
  ]

  for (const item of items) {
    await makePdf(browser, item)
  }
  await browser.close()
}


run()
