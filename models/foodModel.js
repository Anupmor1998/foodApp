const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      trim: true,
    },
    ingredients: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  }
);

const Food = mongoose.model('Food', foodSchema);

module.exports = Food;
