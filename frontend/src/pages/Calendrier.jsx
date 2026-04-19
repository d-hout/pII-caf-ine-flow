import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

export default function Calendrier() {
  const [hoveredDay, setHoveredDay] = useState(null);
  //stockage des conso regroupées par date
  const [consosParDate, setConsosParDate] = useState({});
  const [dateSelectionnee, setDateSelectionnee] = useState(new Date().toISOString().slice(0, 10));
  const [dateVue, setDateVue] = useState(new Date());

  useEffect(() => {
    const chargerConsos = async () => {
      // récupère l'id utilisateur stocké localement pour zvoir accès à ses conso 
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        //récupère la liste des consommations depuis l'api
        const res = await fetch(`http://localhost:5050/api/drinks/${userId}`);
        const data = await res.json();
        
        // regroupe les consommations par jour (clé locale YYYY-MM-DD)
        const groupe = {};
        (data.drinks || []).forEach(c => {
          const d = new Date(c.date);
          const jour = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          if (!groupe[jour]) groupe[jour] = { items: [], total: 0 };
          groupe[jour].items.push(c);
          groupe[jour].total += Number(c.quantiteCafeine || 0);
        });
        setConsosParDate(groupe);
      } catch (err) {
        console.error('Erreur :', err);
      }
    };
    chargerConsos();
  }, []);

  // calcul des valeurs de date utilisées pour générer le calendrier
  const annee = dateVue.getFullYear();
  const mois = dateVue.getMonth();
  const labelMois = dateVue.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const todayKey = new Date().toISOString().slice(0, 10);

  const formatDateKey = (d) => d.toISOString().slice(0, 10);
  const dernieres7Jours = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const key = formatDateKey(d);
    const total = consosParDate[key]?.total || 0;
    return { key, total, label: d.toLocaleDateString('fr-FR', { weekday: 'short' }) };
  });

  const nbJoursDansMois = new Date(annee, mois + 1, 0).getDate();
  let premierJourIndex = new Date(annee, mois, 1).getDay();
  premierJourIndex = (premierJourIndex === 0 ? 6 : premierJourIndex - 1);

  //  afficher la date d'aujourd'hui
  const aujourdHuiLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    //  résumé du mois affiché
    const joursMois = Array.from({ length: nbJoursDansMois }, (_, i) => {
      const dateCle = new Date(annee, mois, i + 1).toISOString().slice(0, 10);
      return { dateCle, total: consosParDate[dateCle]?.total || 0 };
    });
    const totalMois = joursMois.reduce((acc, j) => acc + j.total, 0);
    const nbJoursAvecConso = joursMois.filter(j => j.total > 0).length;
    const nbJoursSansConso = joursMois.length - nbJoursAvecConso;
    const moyenne = joursMois.length > 0 ? Math.round(totalMois / joursMois.length) : 0;
    const record = joursMois.reduce((max, j) => j.total > max.total ? j : max, { total: 0, dateCle: null });

  return (
    <div className="page-tableau">
      <Navbar />
  <div style={{ maxWidth: '700px', margin: '16px auto', padding: '0 12px' }}>

        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ color: '#44312a', fontWeight: 600 }}>{aujourdHuiLabel}</div>
        </div>

    <div className="resume-mois" style={{
      background: 'linear-gradient(90deg, #fdf6f0 60%, #f9f6f2 100%)',
      borderRadius: 18,
      boxShadow: '0 2px 12px #e0cfc2',
      padding: '20px 28px',
      marginBottom: 22,
      display: 'flex',
      gap: 32,
      flexWrap: 'wrap',
      alignItems: 'center',
      border: '1.5px solid #e7d7c9',
      justifyContent: 'space-between',
      minHeight: 60
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 17, color: '#a05a2c', fontWeight: 700, marginBottom: 4 }}>Résumé du mois</span>
        <span style={{ fontWeight: 700, color: '#4b2e19' }}>Moyenne caféine/jour : <span style={{ fontWeight: 400 }}>{moyenne} mg</span></span>
        <span style={{ fontWeight: 700, color: '#4b2e19' }}>Record : <span style={{ fontWeight: 400 }}>{record.total} mg{record.dateCle ? ` (${new Date(record.dateCle).toLocaleDateString('fr-FR')})` : ''}</span></span>
        <span style={{ fontWeight: 700, color: '#4b2e19' }}>Jours sans caféine : <span style={{ fontWeight: 400 }}>{nbJoursSansConso}</span></span>
      </div>
      <button className="btn btn-outline" style={{ fontWeight: 600, fontSize: 15, padding: '10px 18px', borderRadius: 8, border: '1.5px solid #a05a2c', color: '#a05a2c', background: '#fdf6f0', transition: 'background 0.2s, color 0.2s', cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background='#f5e3d3'; e.currentTarget.style.color='#7a3a13'; }} onMouseOut={e => { e.currentTarget.style.background='#fdf6f0'; e.currentTarget.style.color='#a05a2c'; }} onClick={() => {
        // Génération CSV des conso du mois
        const lignes = [
          'Date,Nom,Quantité caféine (mg)'
        ];
        joursMois.forEach(j => {
          const items = consosParDate[j.dateCle]?.items || [];
          items.forEach(c => {
            lignes.push(`${j.dateCle},${c.nomBoisson || ''},${c.quantiteCafeine || 0}`);
          });
        });
        const blob = new Blob([lignes.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historique-cafeine-${annee}-${String(mois+1).padStart(2,'0')}.csv`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      }}>
        Exporter l'historique (CSV)
      </button>
    </div>

        <div className="nav-calendrier" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button aria-label="Mois précédent" onClick={() => setDateVue(new Date(annee, mois - 1, 1))} className="btn-sm btn-outline">‹</button>
            <button
              aria-label="Aujourd'hui"
              onClick={() => { setDateVue(new Date()); setDateSelectionnee(todayKey); }}
              className="btn-sm btn-primary btn-today"
            >
              Aujourd'hui
            </button>
          </div>
          <h2 style={{ textTransform: 'capitalize', fontSize: '1.1rem', margin: 0 }}>{labelMois}</h2>
          <button aria-label="Mois suivant" onClick={() => setDateVue(new Date(annee, mois + 1, 1))} className="btn-sm btn-outline">›</button>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div className="grille-calendrier" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', flex: 1 }}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(j => (
              <div key={j} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>{j}</div>
            ))}

            {Array(premierJourIndex).fill(null).map((_, i) => <div key={`vide-${i}`} />)}

            {Array.from({ length: nbJoursDansMois }, (_, i) => {
              const jour = i + 1;
              const d = new Date(annee, mois, jour);
              const dateCle = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
              const infos = consosParDate[dateCle];
              // si le total dépasse 200mg on colore la case pour avertir l utilisateur
              const estHaut = (infos?.total || 0) >= 200;

              const estAujourdhui = dateCle === todayKey;

              // déterminer le palier en mg pour colorer la case
              let palier = '';
              const total = infos?.total || 0;
              if (infos) {
                if (total >= 400) palier = 'high';
                else if (total >= 200) palier = 'medium';
                else palier = 'low';
              }

              return (
                <div
                  key={dateCle}
                  role="button"
                  tabIndex={0}
                  aria-label={`Jour ${jour} ${infos ? `${infos.items.length} consommation(s)` : ''}`}
                  className={`case-jour ${infos ? 'active' : ''} ${palier ? palier : estAujourdhui ? 'today' : ''}`}
                  onClick={() => setDateSelectionnee(dateCle)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setDateSelectionnee(dateCle); } }}
                  onMouseEnter={() => setHoveredDay(dateCle)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', cursor: 'pointer', minHeight: '56px', position: 'relative' }}
                >
                  <div style={{ fontSize: '0.95rem' }}><strong>{jour}</strong></div>
                  {infos && (
                    <>
                      {record.dateCle === dateCle && record.total > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: '#f59e42',
                          color: '#fff',
                          borderRadius: 8,
                          fontSize: 12,
                          padding: '4px 10px',
                          fontWeight: 700,
                          zIndex: 2,
                          boxShadow: '0 2px 8px #0002'
                        }}>Record</div>
                      )}
                    </>
                  )}
                  {hoveredDay === dateCle && (
                    (() => {
                      // Conversion mg -> tasses (80mg/tasse), arrondi à l'entier le plus proche
                      const mg = infos?.total || 0;
                      const cups = mg > 0 ? Math.round(mg / 80) : 0;
                      return (
                        <div style={{
                          position: 'absolute',
                          left: '50%',
                          top: '100%',
                          transform: 'translateX(-50%)',
                          background: '#fff',
                          color: '#44312a',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          padding: '8px 14px',
                          fontSize: 13,
                          marginTop: 6,
                          zIndex: 10,
                          minWidth: 160,
                          pointerEvents: 'none',
                        }}>
                          <div><strong>{new Date(dateCle).toLocaleDateString('fr-FR')}</strong></div>
                          <div>Total caféine : <strong>{cups} tasse{cups > 1 ? 's' : ''}</strong></div>
                          <div>Consommation{(infos?.items?.length || 0) > 1 ? 's' : ''} : <strong>{infos?.items?.length || 0}</strong></div>
                        </div>
                      );
                    })()
                  )}
                </div>
              );
            })}
          </div>

          <aside className="calendar-legend" aria-hidden={false} style={{ width: 180 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Légende</div>
            <div className="legend-item"><span className="legend-swatch low" aria-hidden style={{ display: 'inline-block' }} /> Faible (&lt; 200 mg)</div>
            <div className="legend-item"><span className="legend-swatch medium" aria-hidden style={{ display: 'inline-block' }} /> Moyen (200–399 mg)</div>
            <div className="legend-item"><span className="legend-swatch high" aria-hidden style={{ display: 'inline-block' }} /> Élevé (≥ 400 mg)</div>
          </aside>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <div style={{ fontSize: 13, color: '#666' }}>Clique sur un jour pour voir le détail</div>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <h3>Détails du {new Date(dateSelectionnee).toLocaleDateString('fr-FR')}</h3>
          {(() => {
            const items = consosParDate[dateSelectionnee]?.items || [];
            const iconePourNom = (nom) => {
              const n = (nom || '').toLowerCase();
              if (n.includes('double')) return '☕️☕️';
              if (n.includes('espresso')) return '☕️';
              if (n.includes('filtre') || n.includes('café')) return '☕';
              if (n.includes('thé')) return '🍵';
              if (n.includes('energy') || n.includes('canette') || n.includes('énergie')) return '⚡';
              return '🥤';
            };

            // Total caféine du jour
            const totalJour = items.reduce((acc, c) => acc + Number(c.quantiteCafeine || 0), 0);

            const detailJour = consosParDate[dateSelectionnee];
            return (
              <div>
                <p className="texte-discret">Tu as enregistré <strong>{items.length}</strong> consommation{items.length > 1 ? 's' : ''} ce jour‑là.</p>
                <p>
                  <strong>Total caféine du jour :</strong> {totalJour} mg
                  {totalJour > 0 && (
                    <span style={{ color: '#a05a2c', fontWeight: 500, marginLeft: 8 }}>
                      (≈ {Math.round(totalJour / 80)} tasse{Math.round(totalJour / 80) > 1 ? 's' : ''})
                    </span>
                  )}
                </p>
                {detailJour && (
                  <div style={{ margin: '0 auto 18px auto', width: '100%' }}>
                    <div style={{
                      background: '#fff',
                      borderRadius: 12,
                      boxShadow: '0 2px 8px #0001',
                      padding: 18,
                      marginBottom: 8,
                      border: '1.5px solid #f3e8ff',
                      minHeight: 60,
                      maxHeight: 220,
                      overflowY: 'auto',
                      transition: 'box-shadow 0.2s',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}>
                      {detailJour.items.length === 0 ? (
                        <div style={{ color: '#a05a2c', fontStyle: 'italic' }}>Aucune consommation ce jour-là.</div>
                      ) : (
                        <ul style={{ width: '100%', paddingLeft: 0, margin: 0 }}>
                          {detailJour.items.map((c, i) => (
                            <li key={i} style={{ marginBottom: 6, color: '#4b2e19' }}>
                              <span style={{ fontWeight: 600 }}>{c.nomBoisson}</span> — {c.quantiteCafeine} mg
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

