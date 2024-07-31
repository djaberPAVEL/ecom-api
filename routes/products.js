const {Product, validate} = require('../models/product'); 
const {Category} = require('../models/category');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const products = await Product.find().sort('name');
  res.send(products);
});

router.post('/', async (req, res) => {
  const { error } = validate(req.body); 
  if (error) return res.status(400).send(error.details[0].message);

  const category = await Category.findById(req.body.categoryId);
  if (!category) return res.status(400).send('Invalid category.');

  const product = new Product({ 
    name: req.body.name,
    category: {
      _id: category._id,
      name: category.name
    },
    numberInStock: req.body.numberInStock,
    defaultPrice: req.body.defaultPrice,
  });
  await product.save();
  
  res.send(product);
});

router.put('/:_id', async (req, res) => {
  const { error } = validate(req.body); 
  if (error) return res.status(400).send(error.details[0].message);

  const category = await Category.findById(req.body.categoryId);
  if (!category) return res.status(400).send('Invalid category.');

  const product = await Product.findByIdAndUpdate(req.params._id,
    { 
      name: req.body.name,
      category: {
        _id: category._id,
        name: category.name
      },
       numberInStock: req.body.numberInStock,
      defaultPrice: req.body.defaultPrice,
      
    }, { new: true });

  if (!product) return res.status(404).send('The product with the given ID was not found.');
  
  res.send(product);
});

router.delete('/:_id', async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params._id);

  if (!product) return res.status(404).send('The product with the given ID was not found.');

  res.send(product);
});

router.get('/:_id', async (req, res) => {
  const product = await Product.findById(req.params._id);

  if (!product) return res.status(404).send('The product with the given ID was not found.');

  res.send(product);
});

module.exports = router; 