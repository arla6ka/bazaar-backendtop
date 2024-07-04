const puppeteer = require('puppeteer');
const Product = require('../models/Product');

const scrapeProductPageKaspi = async (url) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  const productData = await page.evaluate(() => {
    const title = document.querySelector('.item__heading')?.innerText.trim();
    const price = document.querySelector('.item__price-once')?.innerText.trim();
    const imageSrc = document.querySelector('.item__slider-pic')?.src;
    const description = document.querySelector('.item__description-text')?.innerText.trim();
    const specifications = Array.from(document.querySelectorAll('.short-specifications__text'))
      .map(spec => spec.innerText.trim()).join(', ');
    const reviews = Array.from(document.querySelectorAll('.reviews__review-text p'))
      .map(review => review.innerText.trim()).join(' | ');

    return { title, price, description, specifications, reviews, imageSrc };
  });

  await browser.close();
  return productData;
};

const scrapeKaspi = async (query) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  await page.goto(`https://kaspi.kz/shop/search/?text=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2', timeout: 60000 });

  const productLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.item-card__name-link')).slice(0, 12).map(link => link.href);
  });

  for (const link of productLinks) {
    const productData = await scrapeProductPageKaspi(link);
    if (productData.title && productData.price) {
      const product = new Product({ ...productData, link, source: 'Kaspi' });
      await product.save();
    }
  }

  await browser.close();
};

module.exports = { scrapeKaspi };
