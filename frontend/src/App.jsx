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
  const [question, setQuestion] = useState('')
  const [reponse, setReponse] = useState('')
  
  const [estConnexion, setEstConnexion] = useState(true)
  const [message, setMessage] = useState('')
  const [vueRecuperation, setVueRecuperation] = useState(false)
  const navigate = useNavigate()

  //inscription/connexion
  const gererSoumission = async (e) => {
    e.preventDefault()
    const url = estConnexion ? 'http://localhost:5050/api/login' : 'http://localhost:5050/api/register'
    const corps = estConnexion
      ? { email, password: motDePasse }
      : { email, password: motDePasse, questionSecrete: question, reponseSecrete: reponse }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corps)
      })
      const data = await res.json()
      
      if (res.ok) {
        // on stocke l'id attendu par le backend et par les autres composants
        localStorage.setItem('userId', data.userId || data.idUtilisateur)
  navigate('/accueil')
      } else {
        setMessage(data.message)
      }
    } catch (err) { setMessage('Erreur serveur') }
  }

  const gererRecuperation = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setMessage('à faire')
    setTimeout(() => setMessage(''), 4500)
    setVueRecuperation(false)
  }

  if (vueRecuperation) {
    return (
      <div className="conteneur-auth">
        <div className="carte">
          <h2>Récupération</h2>
          <p>La réinitialisation de mot de passe est désactivée pour le moment. Vous pouvez contacter l'administrateur ou réessayer plus tard.</p>
          <div style={{ marginTop: 12 }}>
            <button className="bouton bouton-lien" onClick={() => setVueRecuperation(false)}>Retour</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="conteneur-auth">
      <div className="titre-appli">Caffeine Flow</div>
      <div className="carte">
        <h2>{estConnexion ? 'Connexion' : 'Inscription'}</h2>
        <form onSubmit={gererSoumission}>
          <input className="champ" type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
          <input className="champ" type="password" placeholder="Mot de passe" onChange={e => setMotDePasse(e.target.value)} required />
          
          {!estConnexion && (
            <>
              <input className="champ" placeholder="Question secrète (ex: Nom de mon chat ?)" onChange={e => setQuestion(e.target.value)} required />
              <input className="champ" placeholder="Réponse secrète" onChange={e => setReponse(e.target.value)} required />
            </>
          )}

          <button className="bouton bouton-primaire" type="submit">
            {estConnexion ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <button className="bouton bouton-lien" onClick={() => setEstConnexion(!estConnexion)}>
          {estConnexion ? "Pas de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
        </button>
        
        {estConnexion && (
          <button className="bouton bouton-lien" onClick={() => setVueRecuperation(true)}>
            Mot de passe oublié ?
          </button>
        )}
        {message && <p className="texte-erreur">{message}</p>}
      </div>
    </div>
  )
}

function TableauDeBord() {
  const [configure, setConfigure] = useState(false)
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const verifierProfil = async () => {
      const id = localStorage.getItem('userId')
      if (!id) return navigate('/')

      const res = await fetch(`http://localhost:5050/api/check-profile/${id}`)
      const data = await res.json()
      setConfigure(data.profileConfigured)
      setChargement(false)
    }
    verifierProfil()
  }, [navigate])

  if (chargement) return <div>Chargement...</div>

  return (
    <div className="page-accueil">
      <Navbar />
      {!configure ? (
        <Questionnaire onSave={() => setConfigure(true)} />
      ) : (
        <>
          <Graphique />
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
  <Route path="/calendar" element={<Calendrier />} />
  <Route path="/profile" element={<Profil />} />
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
        <Questionnaire onSave={() => navigate('/tableau-de-bord')} />
      </div>
    </div>
  )
}