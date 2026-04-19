import React, { useState, useEffect } from 'react'

function ItemHistorique({ title, time, emoji, period }) {
  return (
    <div className="element-historique" style={{ padding: 10, borderRadius: 10, background: '#fff', boxShadow: '0 4px 10px rgba(2,6,23,0.04)', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 20 }}>{emoji}</div>
          <div>
            <div className="titre-historique" style={{ fontWeight: 700 }}>{title}</div>
            <div className="texte-discret" style={{ fontSize: 13, color: '#6b7280' }}>{time} · <span style={{ fontWeight: 600, color: '#374151' }}>{period}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function emojiForDrink(nom) {
  if (!nom) return '☕';
  const k = nom.toLowerCase();
  if (k.includes('double')) return '☕☕';
  if (k.includes('espresso')) return '☕';
  if (k.includes('filtre') || k.includes('tasse')) return '☕';
  if (k.includes('instant')) return '🫖';
  if (k.includes('energy') || k.includes('energy')) return '⚡';
  if (k.includes('thé') || k.includes('the')) return '🍵';
  return '☕';
}

export default function Historique() {
  const [consos, setConsos] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  // Objectif en nombre de tasses 
  const [objectifTasses, setObjectifTasses] = useState(() => {
    const val = localStorage.getItem('objectifTassesJour');
    return val ? Number(val) : 5;
  });
  const [editMode, setEditMode] = useState(false);
  const [objectifInput, setObjectifInput] = useState(objectifTasses);
  const [showPopup, setShowPopup] = useState(false);
  const [popupClosed, setPopupClosed] = useState(false);

  const enregistrerObjectif = () => {
    setObjectifTasses(objectifInput);
    localStorage.setItem('objectifTassesJour', objectifInput);
    setEditMode(false);
  };

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
        // Ne garder que les consommations de la journée en cours (>= minuit)
        const all = data.drinks || []
        const debutJournee = new Date()
        debutJournee.setHours(0, 0, 0, 0)
        let today = all.filter(d => {
          const dt = new Date(d.date || d.createdAt)
          return dt >= debutJournee
        })
        // Trier les plus récentes en premier
        today.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
        setConsos(today)
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
    <aside className="carte-historique carte" style={{ width: '100%', minWidth: '350px' }}>
      <div style={{
        background: '#fff8ee',
        border: '1.5px solid #ffe0b2',
        borderRadius: 14,
        padding: 18,
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(255, 200, 100, 0.07)'
      }}>
        <h3 style={{ marginTop: 0 }}>Mon objectif</h3>
        {!editMode ? (
          <div style={{ marginBottom: 16 }}>
            <span>Objectif de tasses/jour : <strong>{objectifTasses} tasse{objectifTasses > 1 ? 's' : ''}</strong></span>
            <button className="btn btn-sm btn-outline" style={{ marginLeft: 12 }} onClick={() => { setEditMode(true); setObjectifInput(objectifTasses); }}>Modifier</button>
          </div>
        ) : (
          <form style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }} onSubmit={e => { e.preventDefault(); enregistrerObjectif(); }}>
            <label htmlFor="objectif-tasses" style={{ fontWeight: 500 }}>Objectif tasses/jour :</label>
            <input id="objectif-tasses" type="number" min="0" value={objectifInput} onChange={e => setObjectifInput(Number(e.target.value))} style={{ width: 80 }} /> tasses
            <button className="btn btn-sm btn-primary" type="submit">Enregistrer</button>
            <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditMode(false)}>Annuler</button>
          </form>
        )}
        <p style={{ fontSize: '0.95em', color: '#666', marginTop: -8, marginBottom: 0 }}>
          <span role="img" aria-label="astuce" style={{ marginRight: 4 }}>💡</span>
          Si vous avez tendance à consommer beaucoup de caféine, pensez à vous fixer un objectif raisonnable pour préserver votre sommeil et votre santé.
        </p>
      </div>
      <h3>Historique du jour</h3>
      <div className="texte-discret">{chargement ? 'Chargement...' : `${consos.length} consommations enregistrées aujourd'hui`}</div>
      <div style={{ marginTop: 8 }}>
        {erreur && <div style={{ marginTop: 8, color: '#d23' }}>Erreur : {erreur}</div>}
      </div>
      <div style={{ marginTop: '16px' }}>
        <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 6, boxSizing: 'content-box' }}>
          {consos.length === 0 && !chargement && (
            <div className="texte-discret">Aucune consommation enregistrée aujourd'hui</div>
          )}
          {(() => {
            const totalMg = consos.reduce((acc, d) => acc + Number(d.quantiteCafeine || d.mg || 0), 0);
            const nbTasses = Math.round(totalMg / 80);
            // Si on repasse sous l'objectif, on autorise à nouveau l'affichage de la popup
            if (nbTasses <= objectifTasses && popupClosed) {
              setTimeout(() => setPopupClosed(false), 300);
            }
            // À chaque nouveau dépassement, on réinitialise popupClosed pour permettre l'affichage de la popup
            if (nbTasses > objectifTasses && !showPopup) {
              setTimeout(() => {
                setPopupClosed(false);
                setShowPopup(true);
              }, 300);
            }
            return consos.map(d => {
              const dt = new Date(d.date || d.createdAt)
              const hour = dt.getHours()
              let period = 'Matin'
              if (hour >= 12 && hour < 18) period = "Après‑midi"
              else if (hour >= 18 && hour < 24) period = 'Soir'
              else if (hour >= 0 && hour < 6) period = 'Nuit'
              const timeStr = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              return (
                <ItemHistorique
                  key={d._id}
                  title={d.nomBoisson || d.nom}
                  time={timeStr}
                  emoji={emojiForDrink(d.nomBoisson || d.nom)}
                  period={period}
                />
              )
            });
          })()}
        </div>
      </div>
    </aside>
  )
}
