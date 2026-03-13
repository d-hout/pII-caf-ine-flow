import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const onglets = [
  { key: 'accueil', label: 'Accueil', onClick: () => navigate('/accueil'), aria: 'Accueil' },
    { key: 'calendrier', label: 'Calendrier', onClick: () => navigate('/calendar'), aria: 'Calendrier' },
    { key: 'profil', label: 'Profil', onClick: () => navigate('/profile'), aria: 'Profil' },
    { key: 'cafes', label: "Cafés proches", onClick: () => navigate('/cafes'), aria: 'Cafés proches' },
  ]

  return (
    <header className="barre-nav" role="navigation" aria-label="Navigation principale">
      <div className="barre-nav-interne">
        <div className="barre-nav-gauche">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="badge-logo">☕</div>
            <div className="titre-appli">Caffeine Flow</div>
          </div>
        </div>

        <nav className="barre-nav-centre" aria-label="Principaux onglets">
          {onglets.map((o) => (
            <button key={o.key} className="onglet" onClick={o.onClick} aria-label={o.aria}>
              {o.label}
            </button>
          ))}
        </nav>

        <div className="barre-nav-droite">
          <button
            className="bouton-contour"
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