import React, { useState } from 'react'

export default function AjoutConso() {
  const [nom, setNom] = useState('')
  const [quantite, setQuantite] = useState('')
  const [message, setMessage] = useState('')
  const [modePerso, setModePerso] = useState(false)
  const [nomPerso, setNomPerso] = useState('')
  const [mgPerso, setMgPerso] = useState('')

  // liste prédéf de boissons avec quantité moyenne en mg
  const optionsBoissons = [
    { id: 'espresso', nom: 'Espresso', mg: 65, label: 'Espresso (65 mg)' },
    { id: 'double-espresso', nom: 'Double Espresso', mg: 125, label: 'Double Espresso (125 mg)' },
    { id: 'cafe-filtre', nom: 'Tasse de café filtre', mg: 95, label: 'Tasse de café filtre (95 mg)' },
    { id: 'cafe-instant', nom: 'Café instantané', mg: 60, label: 'Café instantané (60 mg)' },
    { id: 'energy', nom: 'Canette Energy Drink', mg: 80, label: 'Canette Energy Drink (80 mg)' },
    { id: 'the-noir', nom: 'Thé noir', mg: 30, label: 'Thé noir (30 mg)' }
  ]

  const ajouterConso = async () => {
    const nomFinal = nom;

    // vérif pour avoir tous les champs complétés
    if (!nomFinal || !quantite) {
      return setMessage('Remplir tous les champs')
    }

    try {
      const userId = localStorage.getItem('userId')
      if (!userId) return setMessage('Utilisateur non trouvé')

      const res = await fetch('http://localhost:5050/api/add-drink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idUtilisateur: userId,
          nomBoisson: nomFinal,
          quantiteCafeine: Number(quantite)
        })
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setMessage(data.message || 'Conso ajoutée')
        setNom('')
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

      {!modePerso ? (
        <>
          <select
            className="champ-boisson"
            value={nom ? optionsBoissons.find(o => o.nom === nom)?.id || '' : ''}
            onChange={e => {
              const sel = optionsBoissons.find(o => o.id === e.target.value)
              if (sel) {
                setNom(sel.nom)
                setQuantite(sel.mg)
              } else {
                setNom('')
                setQuantite('')
              }
            }}
            style={{ marginBottom: 8, width: '100%' }}
          >
            <option value="">— Sélectionner —</option>
            {optionsBoissons.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              {quantite ? <div className="texte-discret">Quantité estimée : <strong>{quantite} mg</strong></div> : <div className="texte-discret">Choisir une boisson pour voir la quantité estimée</div>}
            </div>
            <button className="bouton-ajouter" onClick={ajouterConso}>
              Ajouter
            </button>
          </div>

          <button
            onClick={() => { setModePerso(true); setNom(''); setQuantite(''); }}
            style={{ marginTop: 10, background: 'none', border: 'none', color: '#8b4b2b', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', padding: 0 }}
          >
            Ma boisson n'est pas dans la liste
          </button>
        </>
      ) : (
        <>
          <input
            className="champ-boisson"
            type="text"
            placeholder="Nom de la boisson (ex: Matcha latte)"
            value={nomPerso}
            onChange={e => setNomPerso(e.target.value)}
            style={{ marginBottom: 8, width: '100%', boxSizing: 'border-box' }}
          />
          <input
            className="champ-boisson"
            type="number"
            placeholder="Quantité de caféine en mg"
            value={mgPerso}
            onChange={e => setMgPerso(e.target.value)}
            min={0}
            style={{ marginBottom: 8, width: '100%', boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="bouton-ajouter" onClick={() => {
              if (!nomPerso || !mgPerso) return setMessage('Remplir le nom et les mg')
              setNom(nomPerso)
              setQuantite(Number(mgPerso))
              const userId = localStorage.getItem('userId')
              if (!userId) return setMessage('Utilisateur non trouvé')
              fetch('http://localhost:5050/api/add-drink', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idUtilisateur: userId, nomBoisson: nomPerso, quantiteCafeine: Number(mgPerso) })
              }).then(res => res.json().then(data => {
                if (res.ok) {
                  setMessage(data.message || 'Conso ajoutée')
                  setNomPerso(''); setMgPerso(''); setNom(''); setQuantite('')
                  window.dispatchEvent(new Event('drinks-updated'))
                } else setMessage(data.message || 'Erreur serveur')
              })).catch(() => setMessage('Erreur réseau'))
            }}>
              Ajouter
            </button>
          </div>

          <button
            onClick={() => { setModePerso(false); setNomPerso(''); setMgPerso(''); setMessage(''); }}
            style={{ marginTop: 10, background: 'none', border: 'none', color: '#8b4b2b', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', padding: 0 }}
          >
            ← Revenir à la liste
          </button>
        </>
      )}

      {message && <p style={{ fontSize: '0.8rem', marginTop: 8 }}>{message}</p>}

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span role="img" aria-label="ampoule" style={{ fontSize: 18, color: '#eab308' }}>💡</span>
        <span style={{ color: '#444', fontSize: 14 }}>
          <strong>Conseil :</strong> La caféine a une demi‑vie d'environ 5 heures. Évitez d'en consommer <strong>6 heures</strong> avant le coucher.
        </span>
      </div>
    </div>
  )
}
