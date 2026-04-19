import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'

import Navbar from './components/Navbar'
import Calendrier from './pages/Calendrier'
import Graphique from './pages/Graphique'
import AjoutConso from './pages/AjoutConso'
import Historique from './pages/Historique'
import Questionnaire from './pages/Questionnaire'
import CafesProches from './pages/CafeProches'
import MotDePasseOublie from './pages/MotDePasseOublie'
import ReinitialisationMotDePasse from './pages/ReinitialisationMotDePasse'
import Connexion from './pages/Connexion';
import Profil from './pages/Profil';
import Accueil from './pages/Accueil';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Connexion />} />
        <Route path="/accueil" element={<Accueil />} />
        <Route path="/calendrier" element={<Calendrier />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/cafes" element={<CafesProches />} />
        <Route path="/forgot-password" element={<MotDePasseOublie />} />
        <Route path="/reset-password" element={<ReinitialisationMotDePasse />} />
      </Routes>
    </Router>
  );
}