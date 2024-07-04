const puppeteer = require('puppeteer');
const Product = require('../models/Product');

const scrapeProductPageAlfa = async (url) => {
  console.log(`Scraping Alfa product page: ${url}`);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const productData = await page.evaluate(() => {
      const title = document.querySelector('.single-product-title')?.innerText.trim();
      const price = document.querySelector('.price .num')?.innerText.trim();
      const imageSrc = document.querySelector('.gallery-holder img')?.src;
      const description = document.querySelector('.tab-pane#description')?.innerText.trim();
      const specifications = ''; // Alfa does not have detailed specifications available on the product page
      const reviews = ''; // Alfa does not have reviews available on the product page

      return { title, price, description, specifications, reviews, imageSrc };
    });

    console.log(`Scraped product data from Alfa:`, productData);
    await browser.close();
    return productData;
  } catch (error) {
    console.error(`Error scraping Alfa product page: ${url}`, error);
    await browser.close();
    throw error;
  }
};

const scrapeAlfa = async (query) => {
  console.log(`Scraping Alfa for query: ${query}`);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`https://alfa.kz/q/${encodeURIComponent(query)}`, { waitUntil: 'networkidle2', timeout: 60000 });

    const productLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.product-item .title a'))
        .map(link => link.href)
        .filter(link => !link.includes('/wishlist/add')); // Filter out wishlist links
    });

    console.log(`Found ${productLinks.length} product links on Alfa:`, productLinks);

    for (const link of productLinks) {
      try {
        const productData = await scrapeProductPageAlfa(link);
        if (productData.title && productData.price) {
          const product = new Product({ ...productData, link, source: 'Alfa' });
          await product.save();
          console.log(`Saved product to database: ${productData.title}`);
        } else {
          console.warn(`Incomplete product data for link: ${link}`);
        }
      } catch (error) {
        console.error(`Failed to scrape or save product data for link: ${link}`, error);
      }
    }

    await browser.close();
  } catch (error) {
    console.error(`Error scraping Alfa for query: ${query}`, error);
    await browser.close();
    throw error;
  }
};

module.exports = { scrapeAlfa };
