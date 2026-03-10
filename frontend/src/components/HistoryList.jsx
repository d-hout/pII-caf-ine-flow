import React, { useState, useEffect } from 'react'

function HistoryItem({ title, time, mg }) {
  return (
    <div className="history-item">
      <div className="history-left">
        <div>
          <div className="history-title">{title}</div>
          <div className="muted">{time}</div>
        </div>
      </div>
      <div className="history-right">
        <span className="pill">{mg} mg</span>
      </div>
    </div>
  )
}

export default function HistoryList() {
  const [consos, setConsos] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [dernierRetour, setDernierRetour] = useState(null)

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
      const text = await res.text()
      setDernierRetour(text)
      if (!res.ok) {
        setErreur(`HTTP ${res.status}`)
        setConsos([])
      } else {
        const data = JSON.parse(text || '{}')
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

  return (
    <aside className="history-card card">
      <h3>Historique du jour</h3>
  <div className="muted">{chargement ? 'Chargement...' : `${consos.length} consommations enregistrées`}</div>
      <div style={{ marginTop: 8 }}>
        {erreur && <div style={{ marginTop: 8, color: '#d23' }}>Erreur : {erreur}</div>}
        {!erreur && dernierRetour && !chargement && (
          <details style={{ marginTop: 8 }}>
            <pre style={{ maxHeight: 200, overflow: 'auto', background: '#f7f7fb', padding: 8 }}>{dernierRetour}</pre>
          </details>
        )}
      </div>
      <div style={{ marginTop: '16px' }}>
        {consos.length === 0 && !chargement && (
          <div className="muted">Aucune consommation enregistrée</div>
        )}
        {consos.map(d => (
          <HistoryItem
            key={d._id}
            title={d.name}
            time={new Date(d.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            mg={d.cafeineAmount}
          />
        ))}
      </div>
    </aside>
  )
}
