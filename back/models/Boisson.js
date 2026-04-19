const mongoose = require('mongoose');

const BoissonSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  mgCafeine: { type: Number, required: true },
  type: String,
  description: String
});

module.exports = mongoose.model('Boisson', BoissonSchema);
