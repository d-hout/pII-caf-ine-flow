import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';

export default function Questionnaire({ onSave }) {
  const [profile, setProfile] = useState({
    hCoucher: '',
    fumeur: false,
    contraceptif: false,
    enceinte: false,
    palpitations: false,
    nervosite: false
  });
  const [message, setMessage] = useState('');
  const [chargement, setChargement] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [habits, setHabits] = useState(null);

  // charger le profil sauvegardé depuis le backend
  useEffect(() => {
    const chargerProfil = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        setChargement(false)
        return
      }

      try {
        const res = await fetch(`http://localhost:5050/api/get-user/${userId}`)
        if (!res.ok) {
          setChargement(false)
          return
        }
        const data = await res.json()
        const u = data.user || {}
        // remplir l'état profile si on a des valeurs
        setProfile(prev => ({
          hCoucher: u.hCoucher || prev.hCoucher,
          fumeur: typeof u.fumeur === 'boolean' ? u.fumeur : prev.fumeur,
          contraceptif: typeof u.contraceptif === 'boolean' ? u.contraceptif : prev.contraceptif,
          enceinte: typeof u.enceinte === 'boolean' ? u.enceinte : prev.enceinte,
          palpitations: typeof u.palpitations === 'boolean' ? u.palpitations : prev.palpitations,
          nervosite: typeof u.nervosite === 'boolean' ? u.nervosite : prev.nervosite
        }))

        // Charger les recommandations
        const resRec = await fetch(`http://localhost:5050/api/get-recommendations/${userId}`)
        if (resRec.ok) {
          const dataRec = await resRec.json()
          setRecommendations(dataRec.recommendations || [])
        }

        // Charger les habitudes
        const resHabits = await fetch(`http://localhost:5050/api/get-habits/${userId}`)
        if (resHabits.ok) {
          const dataHabits = await resHabits.json()
          setHabits(dataHabits.habits || null)
        }
      } catch (err) {
        console.error('Erreur load profile', err)
      } finally {
        setChargement(false)
      }
    }

    chargerProfil()
  }, [])

  const calculerDemiVie = () => {
    
    let demiVie = 5;
    if (profile.fumeur) demiVie -= 1.5;//le tabac accélère l élimination de la caféine
    if (profile.contraceptif) demiVie += 3; //la prise de contraceptifs prolonge la demi vie
    if (profile.enceinte) demiVie += 10; // chez la femme enceinte la demi-vie peut atteindre ~15h
    if (profile.palpitations) demiVie += 0.5; // les palpitations signalent une sensibilité accrue
    if (profile.nervosite) demiVie += 0.5; // la nervosité aussi, les deux se cumulent
    return demiVie;
  };

  const changerProfil = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value })); // mise à jour du profil au fur et à mesure que l'utilisateur remplit le questionnaire
  };

  const demiVieActuelle = calculerDemiVie()
  const getSensibiliteLabel = (dv) => { //interpetation demi vie 
    if (dv >= 8) return { label: 'Très sensible', color: '#c62828' }
    if (dv >= 6) return { label: 'Sensible', color: '#ef6c00' }
    if (dv >= 4) return { label: 'Normale', color: '#2e7d32' }
    return { label: 'Peu sensible (élimination rapide)', color: '#1565c0' }
  }
  const sensibiliteInterpr = getSensibiliteLabel(demiVieActuelle)

  const calculerSensibiliteDepuisDemiVie = (dv) => {

    // 1 = très sensible, 2 = normale, 3 = peu sensible
    if (dv >= 6) return 1
    if (dv >= 4) return 2
    return 3
  }
  const sensibiliteCalculee = calculerSensibiliteDepuisDemiVie(demiVieActuelle)

  const envoyerQuestionnaire = async (e) => {
    e.preventDefault();
  const demiViePersonnalisee = calculerDemiVie();
    const userId = localStorage.getItem('userId'); // on récupère l'id de l'utilisateur pour associer le profil à son compte

    if (!userId) {
      setMessage('Utilisateur non identifié. Reconnecte-toi.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5050/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          hCoucher: profile.hCoucher,
          // on envoie la sensibilite calculée à partir des réponses, pas un choix manuel
          sensibilite: sensibiliteCalculee,
          demiVie: demiViePersonnalisee,
          fumeur: profile.fumeur,
          contraceptif: profile.contraceptif,
          enceinte: profile.enceinte,
          palpitations: profile.palpitations,
          nervosite: profile.nervosite
        })
      });// on envoie les données du profil au backend 

      if (response.ok) {
        setMessage(`Profil mis à jour ! Demi-vie ≈ ${demiViePersonnalisee}h`);
        if (onSave) onSave({ demiVie: demiViePersonnalisee, sensibilite: Number(sensibiliteCalculee), hCoucher: profile.hCoucher });
      } else {
        const err = await response.json().catch(() => ({}));
        setMessage(err.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Questionnaire submit error', err)
      setMessage('Erreur réseau : impossible de contacter le serveur');
    }
  };

  if (chargement) {
    return (
      <Card title="Questionnaire">
      </Card>
    );
  }

  return (
    <Card title="Mon profil caféine">
      <div style={{
        background: 'linear-gradient(135deg, #fff8ee 0%, #fff3e0 100%)',
        border: '1px solid #ffe0b2',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12
      }}>
        <span style={{ fontSize: 24 }}>🧬</span>
        <div>
          <div style={{ fontWeight: 600, color: '#e65100', marginBottom: 4, fontSize: 14 }}>Pourquoi ces questions ?</div>
          <div style={{ fontSize: 13, color: '#5d4037', lineHeight: 1.5 }}>
            Chaque personne élimine la caféine à un rythme différent selon son mode de vie et sa biologie.
            Ces informations nous permettent d'adapter les calculs et les conseils à votre profil.
          </div>
        </div>
      </div>

      <form onSubmit={envoyerQuestionnaire} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 16px' }}>
          <label style={{ fontSize: 13, color: '#666', marginBottom: 6, display: 'block' }}>
            🌙 Heure habituelle du coucher
          </label>
          <input type="time" value={profile.hCoucher} onChange={e => changerProfil('hCoucher', e.target.value)} className="champ" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Votre profil</div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8f9fa', borderRadius: 8, cursor: 'pointer' }}>
            <input type="checkbox" className="checkbox-questionnaire" checked={profile.fumeur} onChange={e => changerProfil('fumeur', e.target.checked)} />
            <div>
              <div style={{ fontWeight: 500 }}>🚬 Fumeur</div>
              <div style={{ fontSize: 11, color: '#888' }}>Le tabac accélère l'élimination de la caféine</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8f9fa', borderRadius: 8, cursor: 'pointer' }}>
            <input type="checkbox" className="checkbox-questionnaire" checked={profile.contraceptif} onChange={e => changerProfil('contraceptif', e.target.checked)} />
            <div>
              <div style={{ fontWeight: 500 }}>💊 Contraceptif hormonal</div>
              <div style={{ fontSize: 11, color: '#888' }}>Peut ralentir l'élimination et allonger la demi-vie</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8f9fa', borderRadius: 8, cursor: 'pointer' }}>
            <input type="checkbox" className="checkbox-questionnaire" checked={profile.enceinte} onChange={e => changerProfil('enceinte', e.target.checked)} />
            <div>
              <div style={{ fontWeight: 500 }}>🤰 Enceinte</div>
              <div style={{ fontSize: 11, color: '#888' }}>La grossesse ralentit fortement l'élimination (~15h de demi-vie)</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8f9fa', borderRadius: 8, cursor: 'pointer' }}>
            <input type="checkbox" className="checkbox-questionnaire" checked={profile.palpitations} onChange={e => changerProfil('palpitations', e.target.checked)} />
            <div>
              <div style={{ fontWeight: 500 }}>💓 Palpitations</div>
              <div style={{ fontSize: 11, color: '#888' }}>Signe d'une sensibilité accrue à la caféine</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8f9fa', borderRadius: 8, cursor: 'pointer' }}>
            <input type="checkbox" className="checkbox-questionnaire" checked={profile.nervosite} onChange={e => changerProfil('nervosite', e.target.checked)} />
            <div>
              <div style={{ fontWeight: 500 }}>😰 Nervosité</div>
              <div style={{ fontSize: 11, color: '#888' }}>Indique une hypersensibilité à la caféine</div>
            </div>
          </label>
        </div>

        <div style={{
          borderTop: '1px solid #e0e0e0',
          paddingTop: 14,
          marginTop: 4
        }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>☕ Votre vitesse d'élimination estimée</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2c3e50' }}>
            ~{Math.round(demiVieActuelle * 10) / 10} h
            <span style={{ fontSize: 13, fontWeight: 400, color: '#888', marginLeft: 6 }}>pour éliminer la moitié d'un café</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4, color: sensibiliteInterpr.color }}>{sensibiliteInterpr.label}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Button variant="primary" type="submit">Sauvegarder</Button>
          <Button variant="outline" type="button" onClick={() => setMessage('')}>Annuler</Button>
        </div>
      </form>
      {message && <p className="marge-haut-12">{message}</p>}

      {/* Section Habitudes */}
      {habits && habits.totalConsumptions > 0 && (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e0e0e0' }}>
          <h4 style={{ marginBottom: 12, color: '#2c3e50' }}>📊 Vos habitudes (derniers 30 jours)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {/* Total consommations */}
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total de cafés</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff6b35' }}>{habits.totalConsumptions}</div>
            </div>

            {/* Moyenne par jour */}
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Moyenne/jour</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#004e89' }}>
                {habits.averagePerDay} <span style={{ fontSize: 14 }}>tasse{habits.averagePerDay >= 2 ? 's' : ''}</span>
              </div>
            </div>

            {/* Heure préférée */}
            {habits.mostFrequentHour !== null && (
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Heure préférée</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#6a4c93' }}>
                  {String(habits.mostFrequentHour).padStart(2, '0')}h
                </div>
              </div>
            )}

            {/* Boisson préférée */}
            {habits.preferredBeverage && (
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Boisson préférée</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1b998b' }}>{habits.preferredBeverage}</div>
              </div>
            )}

            {/* Moyenne caféine par jour */}
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Moyenne caféine/jour</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#c7254e' }}>{habits.averageCaffeinePerDay} mg</div>
            </div>

            {/* Jours trackés */}
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Jours trackés</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#a23b72' }}>{habits.daysTracked}</div>
            </div>
          </div>

          {/* Pics de consommation */}
          {habits.peakHours.length > 0 && (
            <div style={{ padding: 12, background: '#fffbea', borderRadius: 8, borderLeft: '4px solid #ffc107' }}>
              <strong style={{ display: 'block', marginBottom: 8 }}>⏰ Pics de consommation :</strong>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {habits.peakHours.map((peak, idx) => (
                  <div key={idx} style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 'bold' }}>{String(peak.hour).padStart(2, '0')}h</span> ({peak.count} fois)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section conseils */}
      {recommendations.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e0e0e0' }}>
          <h4 style={{ marginBottom: 12, color: '#2c3e50' }}>💡 Conseils </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recommendations.map((rec, idx) => (
              <div 
                key={idx}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: rec.priority === 'high' ? '#fff3cd' : rec.priority === 'medium' ? '#e3f2fd' : '#f0f4f8',
                  borderLeft: `4px solid ${rec.priority === 'high' ? '#ff9800' : rec.priority === 'medium' ? '#2196f3' : '#4caf50'}`,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start'
                }}
              >
                <span style={{ fontSize: 20 }}>{rec.icon}</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>{rec.title}</strong>
                  <p style={{ margin: 0, fontSize: 13, color: '#555' }}>{rec.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
