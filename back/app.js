const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// Co à la BDD
mongoose.connect('mongodb://127.0.0.1:27017/caffeineflow')
  .then(() => console.log(" MongoDB Connecté"))
  .catch(err => console.log(" Erreur ", err));


const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileConfigured: { type: Boolean, default: false },
  resetToken: String,
  resetExpires: Date,
  hCoucher: String,
  demiVie: Number,
  Fumeur: Boolean,
  Contraceptif: Boolean,
  Palpitations: Boolean,
  Nervosité: Boolean
}));

const Drink = mongoose.model('Drink', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  cafeineAmount: Number,
  date: { type: Date, default: Date.now }
}));


// Inscription
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({ email: req.body.email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "Compte créé ! 🎉", userId: newUser._id });
  } catch (error) {
    res.status(400).json({ message: "Cet email est déjà utilisé" });
  }
});

// Connexion
app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
      res.json({ message: "Bienvenue", userId: user._id });
    } else {
      res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Request password reset (generates a token and (in prod) would email it)
app.post('/api/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Simple token generation (for demo). In production use a secure random token and email it.
    const token = Math.random().toString(36).slice(2, 12);
    user.resetToken = token;
    user.resetExpires = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    console.log(`Reset token for ${email}: ${token}`); // for dev
    // Return token in response for local/dev usage so frontend can continue the flow.
    res.json({ message: 'Token généré (en dev retourné dans la réponse)', token });
  } catch (err) {
    console.error('Erreur request-reset', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// reinitialisation du mdp
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Données manquantes' });

    const user = await User.findOne({ resetToken: token, resetExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Token invalide ou expiré' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    console.error('Erreur reset-password', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Profil verif
app.get('/api/check-profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.json({ profileConfigured: user ? user.profileConfigured : false });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Retourner les données de profil d'un utilisateur (sans le mot de passe)
app.get('/api/get-user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    delete user.password;
    res.json({ user });
  } catch (err) {
    console.error('Erreur get-user', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Profil maj
app.post('/api/update-profile', async (req, res) => {
  const { userId, ...profileData } = req.body;
  if (!userId) return res.status(400).json({ message: "ID utilisateur manquant" });

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { ...profileData, profileConfigured: true }, 
      { returnDocument: 'after' } // Correction ici pour éviter le warning
    );
    if (!updatedUser) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json({ message: "Profil sauvegardé avec succès !", user: updatedUser });
  } catch (err) {
    console.error("Erreur Mongoose :", err);
    res.status(500).json({ message: "Erreur serveur lors de la sauvegarde" });
  }
});

// Boissons ajt
app.post('/api/add-drink', async (req, res) => {
  try {
    const { userId, name, cafeineAmount } = req.body;
    const newDrink = new Drink({ userId, name, cafeineAmount });
    await newDrink.save();
    res.status(201).json({ message: " conso ajoutée !", drink: newDrink });
  } catch (err) {
    console.error("Erreur ajout boisson :", err);
    res.status(500).json({ message: "Erreur lors de l'ajout" });
  }
});

// Boissons recup conso utilisateurs
app.get('/api/drinks/:userId', async (req, res) => {
  try {
    const drinks = await Drink.find({ userId: req.params.userId }).sort({ date: -1 }).lean();
    res.json({ drinks });
  } catch (err) {
    console.error('Erreur récupération boissons :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.listen(5050, () => console.log(" Port 5050"));