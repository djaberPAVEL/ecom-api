const Joi = require('joi');
const mongoose = require('mongoose');
const {categorySchema} = require('./category');
//const { uniq } = require('lodash');

const Product = mongoose.model('Product', new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, 
    minlength: 3,
    maxlength: 255,
    unique: true,
  },
  defaultPrice: { 
    type: Number, 
    required: true,
    min: 0,
  },
  code: {
    type: String,
    required: false,
    trim: true, 
    minlength: 3,
    maxlength: 255
  },
  description: {
    type: String,
    required: false,
    trim: true, 
    minlength: 3,
    maxlength: 255
  },
  category: { 
    type: categorySchema,  
    required: true
  },
  numberInStock: { 
    type: Number, 
    required: false,
    min: 0,
    max: 255
  },
  
  
}));

function validateProduct(product) {
  const schema = {
    name: Joi.string().min(5).max(50).required(),
    categoryId: Joi.string().min(5).max(50).required(),
    defaultPrice: Joi.number().min(0).required(),
    numberInStock:Joi.number().min(0),
    
    
  };

  return Joi.validate(product, schema);
}

exports.Product = Product; 
exports.validate = validateProduct;