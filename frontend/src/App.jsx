import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'

import Navbar from './components/Navbar'
import Calendrier from './components/Calendrier'
import Graphique from './components/Graphique'
import AjoutConso from './components/AjoutConso'
import Historique from './components/Historique'
import Questionnaire from './components/Questionnaire'

function Authentification() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [estConnexion, setEstConnexion] = useState(true)
  const [message, setMessage] = useState('')
  
  const navigate = useNavigate()

  //inscription/connexion
  const gererSoumission = async (e) => {
    e.preventDefault()
    const url = estConnexion ? 'http://localhost:5050/api/login' : 'http://localhost:5050/api/register'
    const corps = { email, password: motDePasse }

    try {
      const res = await fetch(url, {
        method: 'POST', //
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corps)
      })
      const data = await res.json() // on parse la réponse du backend (transfo json en objet)
  console.log('login response', res.status, data)
      
      if (res.ok) {
        // on stocke l'id attendu par le backend et par les autres composants
        localStorage.setItem('userId', data.userId || data.idUtilisateur)
  navigate('/accueil')
      } else {
        setMessage(data.message)
      }
    } catch (err) { setMessage('Erreur serveur') } 
  }


  return (
    <div className="conteneur-auth">
      <div className="titre-appli">Caffeine Flow</div>
      <div className="carte">
        <h2>{estConnexion ? 'Connexion' : 'Inscription'}</h2>
        <form onSubmit={gererSoumission}>
          <input className="champ" type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
          <input className="champ" type="password" placeholder="Mot de passe" 
          onChange={e => setMotDePasse(e.target.value)} required />
          

          <button className="bouton bouton-primaire" type="submit">
            {estConnexion ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <button className="bouton bouton-lien" 
        onClick={() => setEstConnexion(!estConnexion)}>
          {estConnexion ? "Pas de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
        </button>
        
        {message && <p className="texte-erreur">{message}</p>}
      </div>
    </div>
  )
}

function TableauDeBord() {
  const [configure, setConfigure] = useState(false)
  const [demiVie, setDemiVie] = useState(null)
  const [sensibilite, setSensibilite] = useState(null)
  const [hCoucher, setHCoucher] = useState(null)
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate() // hook de navigation pour rediriger l'utilisateur

  useEffect(() => {
    const verifierProfil = async () => {
      const id = localStorage.getItem('userId')
      if (!id) return navigate('/') // si pas d'id, rediriger vers la page de connexion

  const res = await fetch(`http://localhost:5050/api/check-profile/${id}`)
  const data = await res.json() // on vérifie si le profil de l'utilisateur est configuré pour savoir s'il doit remplir le questionnaire ou voir directement laccueil

  setConfigure(data.profilConfigure)
      setChargement(false)
    }
    verifierProfil()
  }, [navigate])

  if (chargement) return <div>Chgt</div>
  return (
    <div className="page-accueil">
      <Navbar />
      {!configure ? (
        <Questionnaire onSave={(obj) => { setConfigure(true); if (obj && typeof obj === 'object') { setDemiVie(obj.demiVie); setSensibilite(obj.sensibilite); setHCoucher(obj.hCoucher); } else { setDemiVie(obj); } }} />
      ) : (
        <>
          <Graphique demiVie={demiVie} sensibilite={sensibilite} hCoucher={hCoucher} />
          <div className="two-col">
            <AjoutConso />
            <Historique />
          </div>
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Authentification />} />
  <Route path="/accueil" element={<TableauDeBord />} />
  <Route path="/calendrier" element={<Calendrier />} />
  <Route path="/profil" element={<Profil />} />
      </Routes>
    </Router>
  )
}

function Profil() {
  const navigate = useNavigate()
  return (
    <div className="page-accueil">
      <Navbar />
      <div style={{ padding: 16 }}>
        <h2>Mon Profil</h2>
        <Questionnaire onSave={() => navigate('/accueil')} />
      </div>
    </div>
  )
}