import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';

export default function Calendrier() {
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
        
        //regroupe les consommations par jour et calcul du total quotidien
        const groupe = {};
        (data.consommations || []).forEach(c => {
          const jour = new Date(c.date).toISOString().slice(0, 10);
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

  // on force lundi = 0
  const nbJoursDansMois = new Date(annee, mois + 1, 0).getDate();
  const premierJourIndex = (new Date(annee, mois, 1).getDay() + 6) % 7;

  return (
    <div className="page-tableau">
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 16px' }}>
        
        <div className="nav-calendrier" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => setDateVue(new Date(annee, mois - 1, 1))}>‹</button>
          <h2 style={{ textTransform: 'capitalize' }}>{labelMois}</h2>
          <button onClick={() => setDateVue(new Date(annee, mois + 1, 1))}>›</button>
        </div>

        <div className="grille-calendrier" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(j => (
            <div key={j} style={{ textAlign: 'center', fontWeight: 'bold' }}>{j}</div>
          ))}
          
          {Array(premierJourIndex).fill(null).map((_, i) => <div key={`vide-${i}`} />)}

          {Array.from({ length: nbJoursDansMois }, (_, i) => {
            const jour = i + 1;
            const dateCle = new Date(annee, mois, jour).toISOString().slice(0, 10);
            const infos = consosParDate[dateCle];
            // si le total dépasse 200mg on colore la case pour avertir l utilisateur
            const estHaut = (infos?.total || 0) >= 200;

            return (
              <div 
                key={dateCle}
                className={`case-jour ${infos ? 'active' : ''} ${estHaut ? 'danger' : ''}`}
                onClick={() => setDateSelectionnee(dateCle)}
                style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center', cursor: 'pointer' }}
              >
                <strong>{jour}</strong>
                {infos && <div style={{ fontSize: '0.8rem' }}>{infos.total}mg</div>}
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: 30 }}>
          <h3>Détails du {new Date(dateSelectionnee).toLocaleDateString('fr-FR')}</h3>
          {(consosParDate[dateSelectionnee]?.items || []).map((c, i) => (
            <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
              <strong>{c.nomBoisson}</strong> : {c.quantiteCafeine} mg
            </div>
          )) }
        </div>
      </div>
    </div>
  );
}