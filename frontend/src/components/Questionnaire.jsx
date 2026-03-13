import React, { useState, useEffect } from 'react';

export default function Questionnaire({ onSave }) {
  const [profile, setProfile] = useState({
    hCoucher: '',
    Fumeur: false,
    Contraceptif: false,
    Palpitations: false,
    Nervosité: false
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
        // Remplir l'état profile si on a des valeurs
        setProfile(prev => ({
          hCoucher: u.hCoucher || prev.hCoucher,
          Fumeur: typeof u.Fumeur === 'boolean' ? u.Fumeur : prev.Fumeur,
          Contraceptif: typeof u.Contraceptif === 'boolean' ? u.Contraceptif : prev.Contraceptif,
          Palpitations: typeof u.Palpitations === 'boolean' ? u.Palpitations : prev.Palpitations,
          Nervosité: typeof u.Nervosité === 'boolean' ? u.Nervosité : prev.Nervosité
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
    if (profile.Fumeur) demiVie -= 1.5;
    if (profile.Contraceptif) demiVie += 3;
    if (profile.Palpitations || profile.Nervosité) demiVie += 1;
    return demiVie;
  };

  const changerProfil = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const envoyerQuestionnaire = async (e) => {
    e.preventDefault();
    const personalizedHalfLife = calculerDemiVie();
    const userId = localStorage.getItem('userId');

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
          demiVie: personalizedHalfLife,
          Fumeur: profile.Fumeur,
          Contraceptif: profile.Contraceptif,
          Palpitations: profile.Palpitations,
          Nervosité: profile.Nervosité
        })
      });

      if (response.ok) {
        setMessage(`Profil mis à jour ! Demi-vie ≈ ${personalizedHalfLife}h`);
        if (onSave) onSave();
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
          <input type="checkbox" checked={profile.Fumeur} onChange={e => changerProfil('Fumeur', e.target.checked)} />{' '}
          Fumeur
        </label>

        <label>
          <input type="checkbox" checked={profile.Contraceptif} onChange={e => changerProfil('Contraceptif', e.target.checked)} />{' '}
          Utilise un contraceptif hormonal
        </label>

        <label>
          <input type="checkbox" checked={profile.Palpitations} onChange={e => changerProfil('Palpitations', e.target.checked)} />{' '}
          Palpitations
        </label>

        <label>
          <input type="checkbox" checked={profile.Nervosité} onChange={e => changerProfil('Nervosité', e.target.checked)} />{' '}
          Nervosité
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="bouton bouton-primaire" type="submit">Sauvegarder</button>
          <button type="button" className="bouton bouton-contour" onClick={() => setMessage('')}>Annuler</button>
        </div>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}