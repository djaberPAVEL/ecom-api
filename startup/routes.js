const express = require('express');
const categories = require('../routes/categories');
const customers = require('../routes/customers');
const cors = require('cors');
const products = require('../routes/products');
const invoices = require('../routes/invoices');
const counters = require('../routes/counters');
const users = require('../routes/users');
const auth = require('../routes/auth');
const error = require('../middleware/error');



module.exports = function(app) {
  app.use(express.json());
  app.use(cors({ origin: '*' }));
  app.use('/api/categories', categories);
  app.use('/api/customers', customers);
  app.use('/api/products', products);
  app.use('/api/invoices', invoices);
  app.use('/api/counters', counters);
  
  app.use('/api/users', users);
  app.use('/api/auth', auth);
  app.use(error);
}