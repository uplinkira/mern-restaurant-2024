const mongoose = require('mongoose');

const MenuCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  restaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }]
});

module.exports = mongoose.model('MenuCategory', MenuCategorySchema);
