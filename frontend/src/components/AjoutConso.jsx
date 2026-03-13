import React, { useState } from 'react'

export default function AjoutConso() {
  //etats pour stocker la sélection, le nom personnalisé et la quantité
  const [nom, setNom] = useState('')
  const [nomLibre, setNomLibre] = useState('') // Pour stocker ce que l'utilisateur tape si "Autre"
  const [quantite, setQuantite] = useState('')
  const [message, setMessage] = useState('')

  const optionsCafe = ['Espresso', 'Café filtre', 'Thé', 'Boisson énergisante']

  const ajouterConso = async () => {
    const nomFinal = nom === 'Autre' ? nomLibre : nom;

    // Vérif pour avoir tous les champs complétés
    if (!nomFinal || !quantite) return setMessage('Remplis tous les champs !')

    try {
      const userId = localStorage.getItem('userId')

      const res = await fetch('http://localhost:5050/api/add-drink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId,
          name: nomFinal,
          cafeineAmount: Number(quantite)
        })
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setMessage(data.message || 'Conso ajoutée')
        setNom('')         
        setNomLibre('')    
        setQuantite('')    
        window.dispatchEvent(new Event('drinks-updated'))
      } else {
        setMessage(data.message || 'Erreur serveur')
      }
    } catch (err) {
      console.error('Erreur ajout conso', err)
      setMessage('Erreur réseau')
    }
  }

  return (
    <div className="carte-consommation">
      <h3>Ajouter une consommation</h3>

      <select 
        className="champ-boisson" 
        value={nom} 
        onChange={e => setNom(e.target.value)} 
        style={{ marginBottom: 8, width: '100%' }}
      >
        <option value="">Choisir une boisson...</option>
        {optionsCafe.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
        <option value="Autre">Autre (saisir manuellement)...</option>
      </select>

      {nom === 'Autre' && (
        <input 
          className="champ-boisson" 
          type="text"
          placeholder="Nom de votre boisson ?"
          value={nomLibre}
          onChange={e => setNomLibre(e.target.value)}
          style={{ marginBottom: 8, width: '100%' }}
        />
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input 
          className="champ-quantite" 
          type="number" 
          placeholder="Quantité (mg)" 
          value={quantite} 
          onChange={e => setQuantite(e.target.value)} 
          style={{ flex: 1 }}
        />
        <button className="bouton-ajouter" onClick={ajouterConso}>
          Ajouter
        </button>
      </div>

      {message && <p style={{ fontSize: '0.8rem', marginTop: 8 }}>{message}</p>}
    </div>
  )
}