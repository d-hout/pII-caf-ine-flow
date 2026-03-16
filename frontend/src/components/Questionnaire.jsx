import React, { useState, useEffect } from 'react';

export default function Questionnaire({ onSave }) {
  const [profile, setProfile] = useState({
    hCoucher: '',
    sensibilite: 2,
    fumeur: false,
    contraceptif: false,
    palpitations: false,
    nervosite: false
  });
  const [message, setMessage] = useState('');
  const [chargement, setChargement] = useState(true)

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
          sensibilite: typeof u.sensibilite !== 'undefined' ? u.sensibilite : prev.sensibilite,
          fumeur: typeof u.fumeur === 'boolean' ? u.fumeur : prev.fumeur,
          contraceptif: typeof u.contraceptif === 'boolean' ? u.contraceptif : prev.contraceptif,
          palpitations: typeof u.palpitations === 'boolean' ? u.palpitations : prev.palpitations,
          nervosite: typeof u.nervosite === 'boolean' ? u.nervosite : prev.nervosite
        }))
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
    if (profile.contraceptif) demiVie += 3; //la prise de cntraceptifs prolongent la demi vie 
    if (profile.palpitations || profile.nervosite) demiVie += 1; // les palpitations et la nervosité peuvent ralentir l elimination 
    return demiVie;
  };

  const changerProfil = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value })); // mise à jour du profil au fur et à mesure que l'utilisateur remplit le questionnaire
  };

  const demiVieActuelle = calculerDemiVie()
  const getSensibiliteLabel = (dv) => { //interpetation demi vie 
    if (dv >= 8) return { label: 'Très sensible (élimination lente)', color: '#c62828' }
    if (dv >= 6) return { label: 'Sensible', color: '#ef6c00' }
    if (dv >= 4) return { label: 'Normale', color: '#2e7d32' }
    return { label: 'Peu sensible (élimination rapide)', color: '#1565c0' }
  }
  const sensibiliteInterpr = getSensibiliteLabel(demiVieActuelle)

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
          sensibilite: profile.sensibilite,
          demiVie: demiViePersonnalisee,
          fumeur: profile.fumeur,
          contraceptif: profile.contraceptif,
          palpitations: profile.palpitations,
          nervosite: profile.nervosite
        })
      });// on envoie les données du profil au backend 

      if (response.ok) {
        setMessage(`Profil mis à jour ! Demi-vie ≈ ${demiViePersonnalisee}h`);
        if (onSave) onSave({ demiVie: demiViePersonnalisee, sensibilite: Number(profile.sensibilite), hCoucher: profile.hCoucher });
      } else {
        const err = await response.json().catch(() => ({}));
        setMessage(err.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Questionnaire submit error', err)
      setMessage('Erreur réseau : impossible de contacter le serveur');
    }
  };

  if (chargement) return (
  <div className="carte">
      <h3>Questionnaire </h3>
    </div>
  )

  return (
  <div className="carte">
      <h3>Questionnaire </h3>
      <form onSubmit={envoyerQuestionnaire} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          Heure habituelle du coucher
          <input type="time" value={profile.hCoucher} onChange={e => changerProfil('hCoucher', e.target.value)} className="champ" />
        </label>

          <label>
            Sensibilité à la caféine
            <select value={profile.sensibilite} onChange={e => changerProfil('sensibilite', Number(e.target.value))} className="champ">
              <option value={1}>1 — Très sensible (élimination lente)</option>
              <option value={2}>2 — Normal</option>
              <option value={3}>3 — Élimination plus rapide</option>
            </select>
          </label>

          <div style={{ marginTop: 6 }}>
            <strong>Demi‑vie estimée :</strong> {Math.round(demiVieActuelle * 10) / 10} h — <span style={{ color: sensibiliteInterpr.color }}>{sensibiliteInterpr.label}</span>
          </div>

        <label>
          <input type="checkbox" checked={profile.fumeur} onChange={e => changerProfil('fumeur', e.target.checked)} />{' '}
          Fumeur
        </label>

        <label>
          <input type="checkbox" checked={profile.contraceptif} onChange={e => changerProfil('contraceptif', e.target.checked)} />{' '}
          Utilise un contraceptif hormonal
        </label>

        <label>
          <input type="checkbox" checked={profile.palpitations} onChange={e => changerProfil('palpitations', e.target.checked)} />{' '}
          Palpitations
        </label>

        <label>
          <input type="checkbox" checked={profile.nervosite} onChange={e => changerProfil('nervosite', e.target.checked)} />{' '}
          Nervosité
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="bouton bouton-primaire" type="submit">Sauvegarder</button>
          <button type="button" className="bouton bouton-contour" onClick={() => setMessage('')}>Annuler</button>
        </div>
      </form>
      {message && <p className="marge-haut-12">{message}</p>}
    </div>
  );
}