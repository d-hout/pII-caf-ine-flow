import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLink, setResetLink] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResetLink('')

    try {
      const res = await fetch('http://localhost:5050/api/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      if (data.resetLink) {
        setResetLink(data.resetLink)
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔐 Mot de passe oublié</h1>

        {!resetLink ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <input 
              type="email" 
              placeholder="Votre email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              disabled={loading}
              style={styles.input}
            />
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? '⏳...' : '📧 Envoyer'}
            </button>
          </form>
        ) : (
          <div style={styles.linkBox}>
            <p>🔗 Lien de réinitialisation :</p>
            <a href={resetLink} style={styles.resetLink}>
              Réinitialiser mon mot de passe
            </a>
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
  linkBox: {
    backgroundColor: '#ecf7ff',
    border: '2px solid #3498db',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  resetLink: {
    display: 'inline-block',
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '13px'
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
