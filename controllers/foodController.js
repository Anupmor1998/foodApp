const Food = require('../models/foodModel');
const factory = require('./handlerFactory');

exports.getIngredients = factory.getAll(Food);

