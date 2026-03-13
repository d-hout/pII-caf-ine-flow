const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// connexion à la BDD
mongoose.connect('mongodb://127.0.0.1:27017/caffeineflow')
  .then(() => console.log("connecté"))
  .catch(err => console.log("Erreur connexion", err));

const Utilisateur = mongoose.model('Utilisateur', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  questionSecrete: String,
  reponseSecrete: String,
  profilConfigure: { type: Boolean, default: false },
  hCoucher: String,
  demiVie: Number,
  fumeur: Boolean,
  contraceptif: Boolean,
  palpitations: Boolean,
  nervosite: Boolean
}));

const Consommation = mongoose.model('Consommation', new mongoose.Schema({
  idUtilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  nomBoisson: String,
  quantiteCafeine: Number,
  date: { type: Date, default: Date.now }
}));


// Inscription
app.post('/api/register', async (req, res) => {
  try {
    const motDePasseHashe = await bcrypt.hash(req.body.password || req.body.motDePasse, 10);
    const nouvelUtilisateur = new Utilisateur({ 
      email: req.body.email, 
      motDePasse: motDePasseHashe,
      questionSecrete: req.body.questionSecrete,
      reponseSecrete: req.body.reponseSecrete 
    });
    await nouvelUtilisateur.save();
    res.status(201).json({ userId: nouvelUtilisateur._id });
  } catch (error) {
    res.status(400).json({ message: "Cet email est déjà utilisé" });
  }
});

// Connexion
app.post('/api/login', async (req, res) => {
  const utilisateur = await Utilisateur.findOne({ email: req.body.email });
  if (utilisateur && await bcrypt.compare(req.body.password || req.body.motDePasse, utilisateur.motDePasse)) {
    res.json({ userId: utilisateur._id });
  } else {
    res.status(401).json({ message: "Email ou mot de passe incorrect." });
  }
});


// 1. Récupérer la question d'un utilisateur
app.get('/api/get-question/:email', async (req, res) => {
  const utilisateur = await Utilisateur.findOne({ email: req.params.email });
  if (utilisateur) {
    res.json({ question: utilisateur.questionSecrete });
  } else {
    res.status(404).json({ message: "Utilisateur non trouvé" });
  }
});



// Verif profil
app.get('/api/check-profile/:userId', async (req, res) => {
  const user = await Utilisateur.findById(req.params.userId);
  res.json({ profileConfigured: user ? user.profilConfigure : false });
});

// Maj profil
app.post('/api/update-profile', async (req, res) => {
  const { userId, ...profileData } = req.body;
  await Utilisateur.findByIdAndUpdate(userId, { ...profileData, profilConfigure: true });
  res.json({ message: "Profil sauvegardé !" });
});

// Ajout boisson
app.post('/api/add-drink', async (req, res) => {
  const { idUtilisateur, nomBoisson, quantiteCafeine } = req.body;
  const nouvelleConso = new Consommation({ idUtilisateur, nomBoisson, quantiteCafeine });
  await nouvelleConso.save();
  res.status(201).json({ message: "Conso ajoutée !" });
});

// Récup boissons
app.get('/api/drinks/:userId', async (req, res) => {
  const drinks = await Consommation.find({ idUtilisateur: req.params.userId }).sort({ date: -1 });

  res.json({ drinks }); 
});

app.listen(5050, () => console.log(" Serveur port 5050"));