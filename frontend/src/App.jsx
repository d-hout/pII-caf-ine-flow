import { useState, useEffect } from 'react'

import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'

import Navbar from './components/Navbar'
import Calendrier from './components/Calendrier'
import ChartCard from './components/ChartCard'
import AddConsumption from './components/AjoutConso'
import HistoryList from './components/HistoryList'
import Questionnaire from './components/Questionnaire' 

function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState('')
  const [chargement, setChargement] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
  setMessage('')
  setChargement(true)
    try {
      const endpoint = isLogin ? 'http://localhost:5050/api/login' : 'http://localhost:5050/api/register'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.message || 'Erreur')
      } else {
        if (data.userId) localStorage.setItem('userId', data.userId) // On stocke l'ID
        setTimeout(() => navigate('/dashboard'), 400)
      }
    } catch (err) {
      console.error('AuthForm submit error', err)
      setMessage('Impossible de contacter le serveur')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="auth-page">
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div className="app-title">Caffeine Flow</div>
      </div>
      <div className="auth-container">
        <div className="card auth-card">
          <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
          <form onSubmit={handleSubmit} className="auth-form"> {/* CETTE CLASSE EST CRUCIALE */}
            <input type="email" className="input auth-input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" className="input auth-input" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn btn-primary auth-submit">{chargement ? '...' : (isLogin ? 'Se connecter' : "S'inscrire")}</button>
          </form>

          {/* Password reset flow */}
          {!showReset && (
            <div style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-link auth-link" onClick={() => { setShowReset(true); setResetMessage('') }}>
                Mot de passe oublié ?
              </button>
            </div>
          )}
          {showReset && (
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}>
                <input type="email" className="input auth-input" placeholder="Email pour réinitialisation" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={async () => {
                    setResetMessage('')
                    try {
                      const res = await fetch('http://localhost:5050/api/request-reset', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: resetEmail })
                      })
                      const data = await res.json()
                      if (!res.ok) {
                        setResetMessage(data.message || 'Erreur')
                      } else {
                        // In dev we receive token in response
                        setResetMessage('Token envoyé (dev) — copie le code ci-dessous et colle-le pour réinitialiser :')
                        setResetToken(data.token || '')
                      }
                    } catch (err) {
                      console.error('Request reset error', err)
                      setResetMessage('Impossible de contacter le serveur')
                    }
                  }}
                >
                  Envoyer
                </button>
                <button type="button" className="btn btn-link auth-link" onClick={() => setShowReset(false)}>Annuler</button>
              </div>

              {resetMessage && <p style={{ marginTop: 10 }}>{resetMessage}</p>}

              {resetToken && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8 }}>
                    <input className="input" placeholder="Code reçu" value={resetToken} onChange={e => setResetToken(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <input type="password" className="input" placeholder="Nouveau mot de passe" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-primary" onClick={async () => {
                      try {
                        const res = await fetch('http://localhost:5050/api/reset-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ token: resetToken, newPassword })
                        })
                        const data = await res.json()
                        if (!res.ok) {
                          setResetMessage(data.message || 'Erreur')
                        } else {
                          setResetMessage('Mot de passe réinitialisé — tu peux maintenant te connecter')
                          setShowReset(false)
                        }
                      } catch (err) {
                        console.error('Apply reset error', err)
                        setResetMessage('Impossible de contacter le serveur')
                      }
                    }}>Appliquer le nouveau mot de passe</button>
                    <button type="button" className="btn btn-link auth-link" onClick={() => { setResetToken(''); setNewPassword('') }}>Effacer</button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="btn btn-link auth-link"
            >
              {isLogin ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Connexion"}
            </button>
            {message && <p className="auth-message" style={{ marginTop: 8 }}>{message}</p>}
          </div>
        </div>

        <aside className="auth-side">
        </aside>
      </div>
    </div>
  )
}



function Dashboard() {
  const [profilConfigure, setProfilConfigure] = useState(false)
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const verifierProfil = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        // Pas d'utilisateur, renvoyer à la page de connexion
        setChargement(false)
        navigate('/')
        return
      }

      try {
        const res = await fetch(`http://localhost:5050/api/check-profile/${userId}`)
        if (!res.ok) {
          setProfilConfigure(false)
        } else {
          const data = await res.json()
          setProfilConfigure(!!data.profileConfigured)
        }
      } catch (err) {
        console.error('Erreur check-profile', err)
        setProfilConfigure(false)
      } finally {
        setChargement(false)
      }
    }

    verifierProfil()
  }, [navigate])

  if (chargement) return <div>Chargement...</div>

  if (!profilConfigure) {
    return (
      <div className="dashboard-page">
          <Navbar showDate={false} />
        <Questionnaire onSave={() => setProfilConfigure(true)} />
      </div>
    )
  }

  return (
    <div className="dashboard-page">
        <Navbar showDate={false} />
      <ChartCard />
      <div className="two-col">
        <AddConsumption />
        <HistoryList />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/calendar" element={<Calendrier />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  )
}

function Profile() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')

  useEffect(() => {
    if (!userId) navigate('/')
  }, [userId, navigate]) 

  return (
    <div className="dashboard-page">
        <Navbar />
      <div style={{ padding: 16 }}>
        <h2>Profil</h2>
        <Questionnaire onSave={() => navigate('/dashboard')} />
      </div>
    </div>
  )
}