require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { scrapeKaspi } = require('./services/scrapeKaspi');
const { scrapeWildberries } = require('./services/scrapeWildberries');
const { scrapeAlfa } = require('./services/scrapeAlfa');
const { formatQuery, getTopProducts, analyzeProductsBatch } = require('./services/analyzeService');
const Product = require('./models/Product');

const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

app.post('/api/search', async (req, res) => {
  const { query } = req.body;

  try {
    const formattedQuery = await formatQuery(query);

    console.log(`Searching for products with query: ${formattedQuery}`);
    const regex = new RegExp(formattedQuery.split(' ').join('|'), 'i'); // Split query into words and create regex

    let products = await Product.find({
      $or: [
        { title: regex },
        { description: regex },
        { specifications: regex },
        { reviews: regex }
      ]
    });
    console.log(`Found ${products.length} products in the database`);

    if (products.length === 0) {
      console.log('No products found in database. Scraping new products...');

      await Promise.all([
        scrapeAlfa(formattedQuery),
        scrapeWildberries(formattedQuery),
        scrapeKaspi(formattedQuery)
      ]);

      products = await Product.find({
        $or: [
          { title: regex },
          { description: regex },
          { specifications: regex },
          { reviews: regex }
        ]
      });
      console.log(`Found ${products.length} products after scraping`);
    }

    if (products.length > 0) {
      await analyzeProductsBatch(products);
    }

    const topProducts = await getTopProducts(products);
    res.json(topProducts);
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ error: 'An error occurred while scraping data.' });
  }
});

app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
