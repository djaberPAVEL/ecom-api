const Joi = require("joi");
const number = require("joi/lib/types/number");
const mongoose = require("mongoose");

const Invoice = mongoose.model(
  "Invoice",
  new mongoose.Schema({
    customer: {
      type: new mongoose.Schema({
        name: {
          type: String,
          required: true,
          minlength: 5,
          maxlength: 50,
        },
        // customerID: {
        //   type: mongoose.Schema.Types.ObjectId,
        //   ref: "Customer",
        //   required: true,
        // },
      }),
      required: true,
    },
    invoiceNumber: { type: String, required: true },
    
    date: { type: Date, required: false, default: Date.now },
    items: [
      {
        type: new mongoose.Schema({
          productName: {
            type: String,
            required: false,
            minlength: 5,
            maxlength: 50,
          },

          quantity: { type: Number, required: true },
          total: { type: Number, required: true },
          price: { type: Number, required: true },
        }),
      },
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["paid", "pending", "cancelled"], default: "paid" }, // Add status field
  })
);

function validateInvoice(invoice) {
  const schema = {
    customerID: Joi.string().required(), // Assuming client ID or name
    //invoiceNumber: Joi.string().required(),
    //date: Joi.date().required(),clea
    items: Joi.array().items({
      productID: Joi.string().required(),
      // productName: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().positive().required(),
      total: Joi.number().positive().required(),
    }),
    totalAmount: Joi.number().positive().required(),
    status:Joi.string().required(),
   
  };

  return Joi.validate(invoice, schema);
}

exports.Invoice = Invoice;
exports.validate = validateInvoice;
