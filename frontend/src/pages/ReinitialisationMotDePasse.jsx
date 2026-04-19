import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ReinitialisationMotDePasse() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    if (!tokenFromUrl) {
      navigate('/forgot-password')
    } else {
      setToken(tokenFromUrl)
    }
  }, [searchParams, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (password !== confirm) {
      setMessage('❌ Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setMessage('❌ Min 6 caractères')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('http://localhost:5050/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('✅ Mot de passe réinitialisé !')
        setTimeout(() => navigate('/login'), 1500)
      } else {
        setMessage(`❌ ${data.message}`)
      }
    } catch (err) {
      setMessage('❌ Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔑 Nouveau mot de passe</h1>

        {token && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <input 
              type="password" 
              placeholder="Nouveau mot de passe" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              disabled={loading}
              style={styles.input}
            />
            <input 
              type="password" 
              placeholder="Confirmer" 
              value={confirm} 
              onChange={e => setConfirm(e.target.value)} 
              required
              disabled={loading}
              style={styles.input}
            />
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? '⏳...' : '🔐 Réinitialiser'}
            </button>
          </form>
        )}

        {message && (
          <div style={{...styles.message, backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da'}}>
            {message}
          </div>
        )}

        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Retour
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '40px',
    maxWidth: '400px',
    width: '100%'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 24px 0',
    color: '#2c3e50',
    textAlign: 'center'
  },
  form: {
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #bdc3c7',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '12px'
  },
  button: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  message: {
    padding: '12px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#3498db',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
    padding: '12px 0',
    borderTop: '1px solid #ecf0f1'
  }
}
