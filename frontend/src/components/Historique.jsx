import React, { useState, useEffect } from 'react'

function ItemHistorique({ title, time, mg }) {
  return (
    <div className="element-historique">
      <div className="historique-gauche">
        <div>
          <div className="titre-historique">{title}</div>
          <div className="texte-discret">{time}</div>
        </div>
      </div>
      <div className="historique-droite">
        <span className="pastille">{mg} mg</span>
      </div>
    </div>
  )
}

export default function Historique() {
  const [consos, setConsos] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  
// fct pour charger les consommations depuis le backend
  const chargerConsos = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      setConsos([])
      setChargement(false)
      return
    }

    try {
      setErreur(null)
      const res = await fetch(`http://localhost:5050/api/drinks/${userId}`)
      // tab des conso récupérées depuis l'api
      if (!res.ok) {
        setErreur(`HTTP ${res.status}`)
        setConsos([])
      } else {
        // On utilise res.json() pour obtenir directement l'objet
        const data = await res.json()
        setConsos(data.drinks || [])
      }
    } catch (err) {
      console.error('Erreur fetch drinks', err)
      setErreur(err.message)
      setConsos([])
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    chargerConsos()

    const handler = () => chargerConsos()
    window.addEventListener('drinks-updated', handler)
    return () => window.removeEventListener('drinks-updated', handler)
  }, [])

  return ( //affichage hitsorique du j 
    <aside className="carte-historique carte" style={{ width: '100%', minWidth: '350px' }}>
      <h3>Historique du jour</h3>
      <div className="texte-discret">{chargement ? 'Chargement...' : `${consos.length} consommations enregistrées`}</div>
      <div style={{ marginTop: 8 }}>
        {erreur && <div style={{ marginTop: 8, color: '#d23' }}>Erreur : {erreur}</div>}
      </div>
      <div style={{ marginTop: '16px' }}>
        {consos.length === 0 && !chargement && (
          <div className="texte-discret">Aucune consommation enregistrée</div>
        )}
        {consos.map(d => (
          <ItemHistorique
            key={d._id}
            title={d.nomBoisson}
            time={new Date(d.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            mg={d.quantiteCafeine}
          />
        ))}
      </div>
    </aside>
  )
}