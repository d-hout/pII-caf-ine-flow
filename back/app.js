const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express(); // on crée une instance d'express pour notre serveur
app.use(express.json()); // pour pouvoir lire les données JSON envoyées par le frontend
app.use(cors()); // pour autoriser les requêtes du frontend (qui tourne sur un autre port)

// connexion à la bdd
mongoose.connect('mongodb://127.0.0.1:27017/caffeineflow') 
  .then(() => console.log("connecté"))
  .catch(err => console.log("Erreur connexion", err)); 

const Utilisateur = mongoose.model('Utilisateur', new mongoose.Schema({ // on définit le schéma de données pour les utilisateurs
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
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


// inscription
app.post('/api/register', async (req, res) => {
  try { // on hash le mdp avant de le stocker dans la bdd pour eviter que 
    // les mdp soient divulgués en cas de piratage
    const motDePasseHashe = await bcrypt.hash(req.body.password || req.body.motDePasse, 10);
    const nouvelUtilisateur = new Utilisateur({  
      email: req.body.email, 
      motDePasse: motDePasseHashe
    }); // on crée un nouvel utilisateur avec les données reçues (email, mdp hashé)
    await nouvelUtilisateur.save();
    res.status(201).json({ userId: nouvelUtilisateur._id });
  } catch (error) { 
    res.status(400).json({ message: "Cet email est déjà utilisé" });
  }
});

// connexion
app.post('/api/login', async (req, res) => {
  // on cherche l'utilisateur par email methode post pour ne pas afficher l'email dans l'url
  const utilisateur = await Utilisateur.findOne({ email: req.body.email });
  if (utilisateur && await bcrypt.compare(req.body.password || req.body.motDePasse, utilisateur.motDePasse)) {
    res.json({ userId: utilisateur._id }); // on retourne l'id attendu par le frontend pour stocker localement et utiliser dans les autres requetes
  } else {
    res.status(401).json({ message: "Email ou mot de passe incorrect." });
  } // si on trouve l'utilisateur et que le mot de passe correspond on retourne son id sinon message d'erreur
});





// verif profil
app.get('/api/check-profile/:userId', async (req, res) => {
  const user = await Utilisateur.findById(req.params.userId);
  res.json({ profilConfigure: user ? user.profilConfigure : false });
}); // on vérifie si le profil de l'utilisateur est déjà configuré pour savoir s'il doit remplir le questionnaire de début ou pas

// maj profil
app.post('/api/update-profile', async (req, res) => {
  const { userId, ...profileData } = req.body;
  await Utilisateur.findByIdAndUpdate(userId, { ...profileData, profilConfigure: true });
  res.json({ message: "Profil sauvegardé !" }); 
  // on met à jour le profil 
  // de l'utilisateur avec les données reçues 
  // et on marque le profil comme configuré
  // pour ne pas lui redemander de remplir 
  // le questionnaire au prochain chargement
});

// ajt boisson
app.post('/api/add-drink', async (req, res) => {
  try {
    // Accepte les deux formats (fr/en) envoyés par le frontend
    console.log('/api/add-drink body:', req.body)
    const idUtilisateur = req.body.idUtilisateur;
    const nomBoisson = req.body.nomBoisson;
    const quantiteCafeine = req.body.quantiteCafeine;

   
    if (!idUtilisateur) return res.status(400).json({ message: 'userId manquant' });
    if (!nomBoisson) return res.status(400).json({ message: 'nom de la boisson manquant' });
    if (quantiteCafeine == null || quantiteCafeine === '') return res.status(400).json({ message: 'quantité de caféine manquante' });

    const nouvelleConso = new Consommation({ idUtilisateur, nomBoisson, quantiteCafeine });
    await nouvelleConso.save(); // création d'une nouvelle conso et ajout dans la bdd
    res.status(201).json({ message: 'Conso ajoutée !' });
  } catch (err) {
    console.error('Erreur /api/add-drink :', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Erreur serveur lors de l'ajout de la consommation" });
  }
});

// récup boissons
app.get('/api/drinks/:userId', async (req, res) => {
  const drinks = await Consommation.find({ idUtilisateur: req.params.userId }).sort({ date: -1 });

  res.json({ drinks });  // on récupère les consommations de l'utilisateur triées par date décroissante et on les retourne au frontend
});

// récupére les informations de l'utilisateur (profil)
app.get('/api/get-user/:userId', async (req, res) => {
  const user = await Utilisateur.findById(req.params.userId).lean();
  if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
  res.json({ user });
});

app.listen(5050, () => console.log(" Serveur port 5050"));