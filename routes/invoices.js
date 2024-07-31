const { Invoice, validate } = require("../models/invoice");
const { Customer } = require("../models/customer");
const { Product } = require("../models/product");
const { Counter } = require("../models/counter");

const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
//const Fawn = require("fawn");
//const { status } = require("express/lib/response");
//Fawn.init(mongoose);

router.get("/sum", async (req, res) => {
  try {
    const invoices = await Invoice.find();
    const totalAmountSum = invoices.reduce((acc, invoice) => acc + invoice.totalAmount, 0);
    res.send({ totalAmountSum });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving invoices.");
  }
});
router.get("/", async (req, res) => {
  // Filtering options based on query parameters (optional)
 // const { customerID, sort = "-date" } = req.query; // Default sort by descending date

  
  const { customerID,name,productName, sort = "-date" } = req.query; // Default sort by descending date

  let filter = {};
  if (name) {
    filter["customer.name"] = { $regex: new RegExp(name, "i") }; // Case-insensitive search
  }
  if (customerID) {
    try {
      const objectId = new mongoose.Types.ObjectId(customerID); // Convert string to ObjectId
      filter["customer._id"] = objectId; // Use converted ObjectId for filtering
    } catch (error) {
      // Handle invalid customerID format (optional)
      return res.status(400).send("Invalid customer ID format.");
    }
  }
  if (productName) {
    filter["items.productName"] = { $regex: new RegExp(productName, "i") }; // Case-insensitive search
  }

  // Projection options to control returned fields (optional)
  const projection = {
    customer: { _id: 1, name: 1 }, // Include only customer ID and name
    items: { productID: 1, quantity: 1 }, // Include only product ID and quantity from items
  };

  try {
    const invoices = await Invoice.find(filter).sort(sort); // Apply filter, projection, and sort
    res.send(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving invoices.");
  }
});


router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const customer = await Customer.findById(req.body.customerID);
  if (!customer) return res.status(400).send("Invalid customer.");

  // Extract and validate items with inventory check

  const validItems = [];
  const insufficientItems = [];

  // Generate a unique invoice number using a counter collection
  const counter = await Counter.findOneAndUpdate(
    {},
    { $inc: { count: 1 } },
    { new: true }
  ); // Find and update counter
  if (!counter) {
    return res.status(500).send("Error generating invoice number.");
  }
  const invoiceNumber = `INV-${counter.count}`; // Generate invoice number with prefix

  for (const item of req.body.items) {
    const product = await Product.findById(item.productID); // Find product

    if (!product) {
      insufficientItems.push({
        productID: item.productID,
        message: "Product not found.",
      });
      continue; // Skip to next item
    }

    if (product.numberInStock < item.quantity) {
      insufficientItems.push({
        productID: item.productID,
        message: "Insufficient stock.",
      });
      continue; // Skip to next item
    }

    validItems.push({
      ...item, // Include all existing item properties
      _id: product._id,
      productName: product.name, // Add product name from the fetched product
      //status: "pending", // Set default status to pending
    });
  }

  if (insufficientItems.length > 0) {
    return res.status(400).send({
      message: "Insufficient stock for some items.",
      details: insufficientItems,
    });
  }
 // console.log(INumber);

  let invoice = new Invoice({
    customer: {
      _id: customer._id,
      name: customer.name,
    },
    invoiceNumber: invoiceNumber,

    items: validItems,
    totalAmount: req.body.totalAmount,
    hala: req.body.hala, // Set default status to pending
  });
  try {
    console.log(invoiceNumber);

    invoice = await invoice.save();
  } catch (error) {
    console.log(error);
  }

  for (const item of validItems) {
    await Product.findByIdAndUpdate(item.productID, {
      
      $inc: { numberInStock: -item.quantity },
      
    });
  }
  res.send(invoice);
});

router.put("/:id", async (req, res) => {
  // const { error } = validateUpdateInvoice(req.body); // Replace with your validation logic
  // if (error) return res.status(400).send(error.details[0].message);

  const invoiceId = req.params.id; // Get invoice ID from URL parameter

  // Find the invoice by ID
  let invoice = await Invoice.findById(invoiceId);
  if (!invoice) return res.status(404).send("Invoice not found.");

  const customer = await Customer.findById(req.body.customerID); // Optional: Update customer if provided
  if (!customer && req.body.customerID) { // Check if customer exists only if ID is provided
    return res.status(400).send("Invalid customer.");
  }

  // Extract and validate updated items (could involve inventory check)
  const validItems = [];
  const insufficientItems = [];
  const itemMap = new Map(); // Map to track existing item IDs and quantities

  // Build a map of existing item IDs and quantities for efficient updates
  for (const item of invoice.items) {
    itemMap.set(item._id.toString(), item.quantity);
    //console.log(item.quantity);
  }
  console.log('itemMap: ',itemMap);

  for (const item of req.body.items) {
    const existingQuantity = itemMap.get(item._id) || 0; // Get existing quantity or default to 0

    const product = await Product.findById(item.productID); // Find product

    if (!product) {
      insufficientItems.push({
        productID: item.productID,
        message: "Product not found.",
      });
      continue; // Skip to next item
    }

    const newQuantity = item.quantity;
    const quantityChange = newQuantity - existingQuantity; // Calculate quantity change

    if (product.numberInStock < quantityChange) {
      insufficientItems.push({
        productID: item.productID,
        message: "Insufficient stock for update.",
      });
      continue; // Skip to next item
    }

    // Perform additional item validation (if needed)
    // const { error } = validateItem(item); // Replace with your validation logic
    // if (error) throw new Error(error.details[0].message);

    validItems.push({
      _id: product._id, // Maintain existing item ID for updates
      productName: product.name, // Add product name from the fetched product
      ...item, // Include all updated item properties
    });
    //console.log(validItems);
    
  }

  if (insufficientItems.length > 0) {
    return res.status(400).send({
      message: "Insufficient stock for some items.",
      details: insufficientItems,
    });
  }

  // Update invoice fields based on request body
  invoice.customer = {
    _id: customer ? customer._id : invoice.customer._id,
    name: customer ? customer.name : invoice.customer.name,
  };
  invoice.items = validItems; // Replace existing items with validated new items
  invoice.totalAmount = req.body.totalAmount; // Update total amount if provided


  
  try {
    invoice = await invoice.save(); // Save updated invoice
    res.send(invoice);
    await updateProductStock(validItems);
    
  } catch (error) {
    console.log(error);
    res.status(500).send("Error updating invoice.");
  }
 //console.log(validItems);
  async function updateProductStock(validItems) {
    for (const item of validItems) {
      console.log(itemMap.get(item._id.toString()));
      const existingQuantity = itemMap.get(item._id.toString()) || 0;
      
      // console.log(itemMap.get(item._id));
       
      const product = await Product.findById(item.productID);
      if (!product) {
        // Handle product not found error (optional: throw error or log a message)
        continue; // Skip to next item
      }
     //console.log("item.quantity: ",item.quantity);
    // console.log("existing quantity : ",existingQuantity);

      const quantityChange = item.quantity - (existingQuantity); // Calculate quantity change
      console.log("quantityChange : ",quantityChange);
      //console.log("stock before",product.numberInStock );
  
      await Product.findByIdAndUpdate(item.productID, {
        $inc: { numberInStock: -quantityChange }, // Update based on signed quantity change
      });
      
    }
  }
});



router.delete("/:id", async (req, res) => {
  const invoiceId = req.params.id; // Get invoice ID from URL parameter

  // Find the invoice by ID
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return res.status(404).send("Invoice not found.");

  // Store item IDs for product stock updates later
  const itemIds = invoice.items.map((item) => item._id.toString());
  console.log(itemIds);

  // Delete the invoice document
  await Invoice.findByIdAndDelete(invoiceId);

  // Update product stock for each item in the invoice (separate operation)
  const updatePromises = itemIds.map((productId) =>
    Product.findByIdAndUpdate(productId, { $inc: { numberInStock: invoice.items.find((item) => item._id.toString() === productId).quantity } }, { new: true })
  );

  try {
    const updatedProducts = await Promise.all(updatePromises); // Execute product stock updates in parallel

    // Handle potential errors during product stock updates (optional)
    const errors = updatedProducts.filter((product) => !product); // Check for failed updates
    if (errors.length > 0) {
      console.warn("Errors encountered while updating product stock:", errors);
      // You can choose to send a partial success response with details here
    }

    res.send({ message: "Invoice deleted successfully." }); // Optional success message
  } catch (error) {
    console.log(error);
    res.status(500).send("Error deleting invoice.");
  }
});



router.get("/:id", async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice)
    return res.status(404).send("The invoice with the given ID was not found.");

  res.send(invoice);
});

module.exports = router;
