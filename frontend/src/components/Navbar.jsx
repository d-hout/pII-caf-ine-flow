import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate() 
  
  const onglets = [ // on définit les onglets de navigation 
    { key: 'accueil', label: 'Accueil', path: '/accueil', icon: '🏠' },
    { key: 'calendrier', label: 'Calendrier', path: '/calendrier', icon: '📅' },
    { key: 'profil', label: 'Profil', path: '/profil', icon: '👤' },
    { key: 'cafes', label: "Cafés proches", path: '/cafes', icon: '📍' }
  ]

  function handleDeconnexion() { // fct pour gérer la déconnexion on supprime l'id utilisateur du localStorage et on redirige vers la page de connexion
    localStorage.removeItem('userId')
    navigate('/')
  }

  return (
    <header className="barre-nav">
      <div className="barre-nav-interne">
        <div className="barre-nav-gauche">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="badge-logo">☕</div>
            <div className="titre-appli">Caffeine Flow</div>
          </div>
        </div>

        <nav className="barre-nav-centre">
          {onglets.map(function (onglet) { 
            return (
              <button 
                key={onglet.key} // identifiant unique pour chaque élément de la liste
                className="onglet" 
                onClick={() => navigate(onglet.path)} // on utilise le 
                // chemin défini dans chaque onglet 
                // pour la navigation
              >
                  <span className="nav-emoji" aria-hidden style={{ marginRight: 8 }}>{onglet.icon}</span>
                  {onglet.label}
                </button>
            )
          })}
        </nav>

        <div className="barre-nav-droite">
          <button className="bouton-contour" onClick={handleDeconnexion}>
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  )
}