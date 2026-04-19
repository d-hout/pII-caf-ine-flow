const mongoose = require('mongoose');

const ConsommationSchema = new mongoose.Schema({
  idUtilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  idBoisson: { type: mongoose.Schema.Types.ObjectId, ref: 'Boisson' },
  nomBoisson: String,
  quantiteCafeine: Number,
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Consommation', ConsommationSchema);
