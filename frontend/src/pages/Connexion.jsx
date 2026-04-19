import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import '../App.css';

function Connexion() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [estConnexion, setEstConnexion] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const gererSoumission = async (e) => {
    e.preventDefault();
    const url = estConnexion ? 'http://localhost:5050/api/login' : 'http://localhost:5050/api/register';
    const corps = { email, password: motDePasse };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corps)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userId', data.userId || data.idUtilisateur);
        navigate('/accueil');
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage('Erreur serveur');
    }
  };

  return (
    <div className="conteneur-auth">

      <div style={{ width: 400 }}>
        <Card>
          <h2 style={{ marginTop: 0, marginBottom: 20, color: '#44312a' }}>{estConnexion ? 'Connexion' : 'Inscription'}</h2>
          <form onSubmit={gererSoumission} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input className="champ" type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
            <input className="champ" type="password" placeholder="Mot de passe" onChange={e => setMotDePasse(e.target.value)} required />
            <button type="submit" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, fontWeight: 700, border: 'none', color: '#fff', fontSize: 15, cursor: 'pointer', background: 'linear-gradient(135deg, #a67c5b, #8b5e3c)' }}>
              {estConnexion ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Button variant="link" onClick={() => setEstConnexion(!estConnexion)}>
              {estConnexion ? "Pas de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
            </Button>
            {estConnexion && (
              <Button variant="link" onClick={() => navigate('/forgot-password')}>Mot de passe oublié ?</Button>
            )}
          </div>
          {message && <p className="texte-erreur">{message}</p>}
        </Card>
      </div>

      <div style={{ maxWidth: 380, flex: '0 0 380px' }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#44312a', marginBottom: 8 }}>☕ Caféine Flow</div>
        <div style={{ fontSize: 15, color: '#7a5c4f', lineHeight: 1.7, marginBottom: 20 }}>
          Suivez en temps réel la caféine dans votre organisme et comprenez son impact sur votre sommeil.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 22 }}>📊</span>
            <div>
              <div style={{ fontWeight: 600, color: '#44312a', fontSize: 14 }}>Courbe personnalisée</div>
              <div style={{ fontSize: 12, color: '#999' }}>Visualisez la décroissance de la caféine selon votre profil biologique</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <div>
              <div style={{ fontWeight: 600, color: '#44312a', fontSize: 14 }}>Alertes intelligentes</div>
              <div style={{ fontSize: 12, color: '#999' }}>Recevez des conseils adaptés à vos habitudes et votre heure de coucher</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🧬</span>
            <div>
              <div style={{ fontWeight: 600, color: '#44312a', fontSize: 14 }}>Profil biologique</div>
              <div style={{ fontSize: 12, color: '#999' }}>Tabac, contraceptifs, grossesse… votre demi-vie est unique</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 22 }}>📍</span>
            <div>
              <div style={{ fontWeight: 600, color: '#44312a', fontSize: 14 }}>Cafés à proximité</div>
              <div style={{ fontSize: 12, color: '#999' }}>Trouvez les cafés autour de vous sur une carte interactive</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Connexion;
