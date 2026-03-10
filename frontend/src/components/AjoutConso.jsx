import React, { useState } from 'react'

export default function AjoutConso() {
  const [nom, setNom] = useState('')
  const [quantite, setQuantite] = useState('')
  const [message, setMessage] = useState('')

  const optionsCafe = ['Espresso', 'Café filtre', 'Thé', 'Boisson énergisante']

  const ajouterConso = async () => {
    if (!nom || !quantite) return setMessage('Remplis tous les champs !')
    try {
      const userId = localStorage.getItem('userId')
      const res = await fetch('http://localhost:5050/api/add-drink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: nom, cafeineAmount: Number(quantite) })
      })
      if (res.ok) {
        setMessage('Consommation ajoutée')
        setNom('')
        setQuantite('')
        window.dispatchEvent(new Event('drinks-updated'))
      } else setMessage('Erreur serveur')
    } catch (err) {
      console.error('Add consumption error', err)
      setMessage('Erreur réseau')
    }
  }

  return (
    <div className="card">
      <h3>Ajouter une consommation</h3>

      <select className="input" value={nom} onChange={e => setNom(e.target.value)} style={{ marginBottom: 8 }}>
        <option value="">Choisir une boisson...</option>
        {optionsCafe.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
        <option value="Autre">Autre...</option>
      </select>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="input quantity-input" type="number" placeholder="Quantité (mg)" value={quantite} onChange={e => setQuantite(e.target.value)} />
        <button className="btn btn-sm btn-primary" onClick={ajouterConso}>Ajouter</button>
      </div>

      {message && <div className="muted" style={{ marginTop: 8 }}>{message}</div>}
    </div>
  )
}