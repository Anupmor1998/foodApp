const express = require('express');
const { getIngredients } = require('../controllers/foodController');

const router = express.Router();


router
  .route('/:name')
  .get(getIngredients)

module.exports = router;
