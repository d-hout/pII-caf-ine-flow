const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

// connexion à la bdd
mongoose.connect('mongodb://127.0.0.1:27017/caffeineflow') 
  .then(() => console.log("connecté"))
  .catch(err => console.log("Erreur connexion", err)); 


const Utilisateur = require('./models/Utilisateur');
const Consommation = require('./models/Consommation');
const Boisson = require('./models/Boisson');

// Catalogue de boissons par défaut (créer si collection vide)
async function initBoissons() {
  const count = await Boisson.countDocuments();
  if (count === 0) {
    const boissons = [
      { nom: 'Café filtre', mgCafeine: 95, type: 'café', description: 'Café filtre standard' },
      { nom: 'Espresso', mgCafeine: 63, type: 'café', description: 'Espresso simple' },
      { nom: 'Café double', mgCafeine: 126, type: 'café', description: 'Double espresso' },
      { nom: 'Thé noir', mgCafeine: 47, type: 'thé', description: 'Thé noir infusé' },
      { nom: 'Thé vert', mgCafeine: 28, type: 'thé', description: 'Thé vert infusé' },
      { nom: 'Décaféiné', mgCafeine: 3, type: 'décaféiné', description: 'Café décaféiné' },
      { nom: 'Energy drink', mgCafeine: 80, type: 'energy', description: 'Boisson énergisante' },
    ];
    await Boisson.insertMany(boissons);
  }
}
initBoissons().catch(console.error);


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

// récup boissons (catalogue)
app.get('/api/boissons', async (req, res) => {
  try {
    const boissons = await Boisson.find().sort({ type: 1, nom: 1 });
    res.json({ boissons });
  } catch (err) {
    console.error('Erreur /api/boissons:', err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des boissons" });
  }
});

// ajt boisson
app.post('/api/add-drink', async (req, res) => {
  try {
    console.log('/api/add-drink body:', req.body)
    const idUtilisateur = req.body.idUtilisateur;
    const idBoisson = req.body.idBoisson; 
    const nomBoisson = req.body.nomBoisson; 
    let quantiteCafeine = req.body.quantiteCafeine;

    if (!idUtilisateur) return res.status(400).json({ message: 'userId manquant' });
    
    if (idBoisson) {
      const boisson = await Boisson.findById(idBoisson);
      if (!boisson) return res.status(404).json({ message: 'Boisson non trouvée' });
      quantiteCafeine = boisson.mgCafeine;
      const nouvelleConso = new Consommation({ idUtilisateur, idBoisson, nomBoisson: boisson.nom, quantiteCafeine });
      await nouvelleConso.save();
      return res.status(201).json({ message: 'Conso ajoutée !', conso: nouvelleConso });
    }
    
    if (!nomBoisson) return res.status(400).json({ message: 'nom de la boisson ou idBoisson manquant' });
    if (quantiteCafeine == null || quantiteCafeine === '') return res.status(400).json({ message: 'quantité de caféine manquante' });

    const nouvelleConso = new Consommation({ idUtilisateur, nomBoisson, quantiteCafeine });
    await nouvelleConso.save(); // création d'une nouvelle conso et ajout dans la bdd
    res.status(201).json({ message: 'Conso ajoutée !', conso: nouvelleConso });
  } catch (err) {
    console.error('Erreur /api/add-drink :', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Erreur serveur lors de l'ajout de la consommation" });
  }
});

// demande de réinitialisation de mot de passe
app.post('/api/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis' });

    const user = await Utilisateur.findOne({ email });
    if (!user) return res.status(200).json({ message: 'Si le compte existe, un email sera envoyé.' });

    // Générer token et date d expiration(1 heure)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600 * 1000;

    user.resetToken = token;
    user.resetTokenExpires = new Date(expires);
    await user.save();

    // Lien de réinitialisation
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    console.log(`\n📧 Lien de réinitialisation pour ${email}:`);
    console.log(`   ${resetLink}\n`);

    return res.json({ 
      message: 'Lien de réinitialisation généré',
      resetLink: resetLink
    });
  } catch (err) {
    console.error('Erreur request-password-reset:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

// reset du mot de passe avec token
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });

    const user = await Utilisateur.findOne({ resetToken: token, resetTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Token invalide ou expiré' });

    const motDePasseHashe = await bcrypt.hash(newPassword, 10);
    user.motDePasse = motDePasseHashe;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (err) {
    console.error('Erreur reset-password:', err);
    res.status(500).json({ message: 'Erreur serveur' });
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

// Recommandations personnalisées basées sur le profil
app.get('/api/get-recommendations/:userId', async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.params.userId).lean();
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const recommendations = [];

    // Heure de coucher
    if (user.hCoucher) {
      const [heure, minute] = user.hCoucher.split(':').map(Number);
      const heureNumeric = heure + minute / 60;
      
      // Calculer l'heure limite (demi-vie * 2 pour que ça se dissipe ~95%)
      const demiVie = user.demiVie || 5;
      const heureLimit = Math.max(14, 24 - (demiVie * 2));
      
      recommendations.push({
        icon: '⏰',
        title: 'Heure limite pour la caféine',
        text: `Arrête la caféine avant ${Math.floor(heureLimit)}:${String(Math.round((heureLimit % 1) * 60)).padStart(2, '0')} pour dormir à ${user.hCoucher}`,
        priority: 'high'
      });
    }

    // Fumeur
    if (user.fumeur) {
      recommendations.push({
        icon: '🚬',
        title: 'Impact du tabac',
        text: 'Le tabac accélère l\'élimination de la caféine. Tu peux supporter un peu plus de caféine.',
        priority: 'medium'
      });
    }

    // Contraceptif
    if (user.contraceptif) {
      recommendations.push({
        icon: '💊',
        title: 'Effet du contraceptif',
        text: 'Les contraceptifs prolongent la demi-vie de la caféine (~3h de plus). Sois prudent.',
        priority: 'high'
      });
    }

    // Palpitations
    if (user.palpitations) {
      recommendations.push({
        icon: '❤️',
        title: 'Attention aux palpitations',
        text: 'Limite la caféine - elle peut aggraver tes palpitations.',
        priority: 'high'
      });
    }

    // Nervosité
    if (user.nervosite) {
      recommendations.push({
        icon: '😰',
        title: 'Gère ton stress',
        text: 'La caféine augmente la nervosité. Essaie de réduire ta consommation les jours stressants.',
        priority: 'medium'
      });
    }

    // Demi-vie générale
    const dv = user.demiVie || 5;
    if (dv >= 8) {
      recommendations.push({
        icon: '⚠️',
        title: 'Tu es très sensible à la caféine',
        text: 'Préfère les cafés décaféinés après midi. Moins de 200mg par jour recommandé.',
        priority: 'high'
      });
    } else if (dv >= 6) {
      recommendations.push({
        icon: '⚠️',
        title: 'Tu es sensible à la caféine',
        text: 'Limite-toi à 1-2 cafés par jour. Rien après 15h.',
        priority: 'medium'
      });
    } else if (dv <= 3) {
      recommendations.push({
        icon: '✅',
        title: 'Tu tolères bien la caféine',
        text: 'Tu peux en consommer plus, mais reste raisonnable !',
        priority: 'low'
      });
    }

    res.json({ recommendations });
  } catch (err) {
    console.error('Erreur get-recommendations:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupère les habitudes de consommation de l'utilisateur
app.get('/api/get-habits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Récupérer toutes les consommations de l'utilisateur (derniers 30 j)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const consommations = await Consommation.find({
      idUtilisateur: userId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });

    if (consommations.length === 0) {
      return res.json({
        habits: {
          totalConsumptions: 0,
          averagePerDay: 0,
          mostFrequentHour: null,
          preferredBeverage: null,
          totalCaffeine: 0,
          peakHours: []
        }
      });
    }

    // Stat
    const totalConsumptions = consommations.length;
    const daysTracked = Math.max(1, (new Date() - new Date(consommations[consommations.length - 1].date)) / (1000 * 60 * 60 * 24) + 1);
    const averagePerDay = (totalConsumptions / daysTracked).toFixed(1);

    // Heure de conso la plus fréquente
    const hourCounts = {};
    const beverageCounts = {};
    let totalCaffeine = 0;

    consommations.forEach(conso => {
      // Heure
      const hour = new Date(conso.date).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;

      // Boisson
      const bevName = conso.nomBoisson || 'Inconnu';
      beverageCounts[bevName] = (beverageCounts[bevName] || 0) + 1;

      // Total caféine
      totalCaffeine += conso.quantiteCafeine || 0;
    });

    // Heure la plus fréquente
    const mostFrequentHour = Object.keys(hourCounts).reduce((a, b) =>
      hourCounts[a] > hourCounts[b] ? a : b
    );

    // Top 3 heures de consommation (pour les "pics")
    const sortedHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));

    // Boisson préférée
    const preferredBeverage = Object.keys(beverageCounts).reduce((a, b) =>
      beverageCounts[a] > beverageCounts[b] ? a : b
    );

    res.json({
      habits: {
        totalConsumptions,
        averagePerDay: parseFloat(averagePerDay),
        mostFrequentHour: parseInt(mostFrequentHour),
        preferredBeverage,
        totalCaffeine: Math.round(totalCaffeine),
        averageCaffeinePerDay: Math.round(totalCaffeine / daysTracked),
        peakHours: sortedHours,
        daysTracked: Math.round(daysTracked)
      }
    });
  } catch (err) {
    console.error('Erreur get-habits:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.listen(5050, () => console.log(" Serveur port 5050"));