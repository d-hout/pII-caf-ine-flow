const mongoose = require('mongoose');

const UtilisateurSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  profilConfigure: { type: Boolean, default: false },
  hCoucher: String,
  demiVie: Number,
  fumeur: Boolean,
  contraceptif: Boolean,
  enceinte: Boolean,
  palpitations: Boolean,
  nervosite: Boolean,
  resetToken: String,
  resetTokenExpires: Date
});

module.exports = mongoose.model('Utilisateur', UtilisateurSchema);
