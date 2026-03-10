import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const onglets = [
    { key: 'accueil', label: 'Accueil', onClick: () => navigate('/dashboard'), aria: 'Accueil' },
    { key: 'calendrier', label: 'Calendrier', onClick: () => navigate('/calendar'), aria: 'Calendrier' },
    { key: 'profil', label: 'Profil', onClick: () => navigate('/profile'), aria: 'Profil' },
    { key: 'cafes', label: "Cafés proches", onClick: () => navigate('/cafes'), aria: 'Cafés proches' },
  ]

  return (
    <header className="top-nav" role="navigation" aria-label="Navigation principale">
      <div className="top-nav-inner">
        <div className="top-nav-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-badge">☕</div>
            <div className="app-title">Caffeine Flow</div>
          </div>
        </div>

        <nav className="top-nav-center" aria-label="Principaux onglets">
          {onglets.map((o) => (
            <button key={o.key} className="tab" onClick={o.onClick} aria-label={o.aria}>
              {o.label}
            </button>
          ))}
        </nav>

        <div className="top-nav-right">
          <button
            className="btn-outline"
            onClick={() => {
              localStorage.removeItem('userId')
              navigate('/')
            }}
            aria-label="Se déconnecter"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </header>
  )
}