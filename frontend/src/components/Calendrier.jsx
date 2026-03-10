import React, { useEffect, useState } from 'react'
import Navbar from './Navbar'

export default function Calendrier() {
  const [consosParDate, setConsosParDate] = useState({})
  const [dateSelectionnee, setDateSelectionnee] = useState(new Date().toISOString().slice(0, 10))
  const [dateVue, setDateVue] = useState(new Date()) // date used to render current month

  useEffect(() => {
    const fetchDrinks = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) return

      try {
        const res = await fetch(`http://localhost:5050/api/drinks/${userId}`)
        const data = await res.json()

        const grouped = {}
        ;(data.drinks || []).forEach(d => {
          const day = new Date(d.date).toISOString().slice(0, 10)
          if (!grouped[day]) grouped[day] = { items: [], total: 0 }
          grouped[day].items.push(d)
          grouped[day].total += Number(d.cafeineAmount || 0)
        })
  setConsosParDate(grouped)
      } catch (err) {
        console.error('Erreur chargement consommations', err)
      }
    }

    fetchDrinks()
  }, [])

  const moisPrecedent = () => setDateVue(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const moisSuivant = () => setDateVue(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const year = dateVue.getFullYear()
  const month = dateVue.getMonth()
  const labelMois = dateVue.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // build days grid for the month with leading blanks so weekday alignment is correct (Mon..Sun)
  const firstWeekday = new Date(year, month, 1).getDay() // 0 (Sun) - 6 (Sat)
  const leading = (firstWeekday + 6) % 7 // convert to Monday=0
  const daysCount = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let d = 1; d <= daysCount; d++) cells.push(d)

  return (
    <div className="dashboard-page">
      <Navbar />
  <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 16px' }}>
        <div className="calendar-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button className="btn btn-outline" onClick={moisPrecedent} aria-label="Mois précédent">‹</button>
          <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{labelMois}</div>
          <button className="btn btn-outline" onClick={moisSuivant} aria-label="Mois suivant">›</button>
        </div>

        <div className="calendar-grid">
          {/* weekdays header */}
          {['LUN','MAR','MER','JEU','VEN','SAM','DIM'].map( wd => (
            <div key={wd} style={{ fontWeight:700, textAlign:'center' }}>{wd}</div>
          ))}

          {cells.map((day, idx) => {
            if (day === null) return <div key={`b-${idx}`} />
            const dateKey = new Date(year, month, day).toISOString().slice(0,10)
            const donneesJour = consosParDate[dateKey]
            const estHaut = (donneesJour?.total || 0) >= 200
            return (
              <div
                key={dateKey}
                className={`day-card ${donneesJour ? 'active' : ''} ${estHaut ? 'danger' : ''}`}
                onClick={() => donneesJour && setDateSelectionnee(dateKey)}
              >
                <span className="day-number" style={{ fontWeight:700 }}>{day}</span>
                {donneesJour && <small style={{ marginTop:6 }}>{donneesJour.total}mg</small>}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 20 }} className="card">
          <h3 style={{ marginTop: 0 }}>Consommations du {new Date(dateSelectionnee).toLocaleDateString('fr-FR')}</h3>
          {(consosParDate[dateSelectionnee]?.items || []).length === 0 && (
            <div className="muted">Aucune consommation enregistrée pour cette date.</div>
          )}
          {(consosParDate[dateSelectionnee]?.items || []).map((d, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight:700 }}>{d.name}</div>
              <div className="muted">{new Date(d.date).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })} — {d.cafeineAmount} mg</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}