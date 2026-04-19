import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Graphique from './Graphique';
import AjoutConso from './AjoutConso';
import Historique from './Historique';
import Questionnaire from './Questionnaire';
import { useNavigate } from 'react-router-dom';

function Accueil() {
  const [configure, setConfigure] = useState(false);
  const [demiVie, setDemiVie] = useState(null);
  const [sensibilite, setSensibilite] = useState(null);
  const [hCoucher, setHCoucher] = useState(null);
  const [chargement, setChargement] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifierProfil = async () => {
      const id = localStorage.getItem('userId');
      if (!id) return navigate('/');
      try {
        const res = await fetch(`http://localhost:5050/api/check-profile/${id}`);
        const data = await res.json();
        setConfigure(data.profilConfigure);
        if (data.profilConfigure) {
          try {
            const resUser = await fetch(`http://localhost:5050/api/get-user/${id}`);
            if (resUser.ok) {
              const userData = await resUser.json();
              const u = userData.user || {};
              if (typeof u.demiVie === 'number') setDemiVie(u.demiVie);
              if (typeof u.sensibilite !== 'undefined') setSensibilite(Number(u.sensibilite));
              if (u.hCoucher) setHCoucher(u.hCoucher);
            }
          } catch (errUser) {
            console.error('Impossible de charger le profil utilisateur', errUser);
          }
          try {
            const resDrinks = await fetch(`http://localhost:5050/api/drinks/${id}`);
            if (resDrinks.ok) {
              const dataDrinks = await resDrinks.json();
              console.log('DIAG Consommations reçues (global):', (dataDrinks.drinks || []).map(d => ({ nom: d.nomBoisson, date: d.date, createdAt: d.createdAt })));
            }
          } catch (errDrinks) {
            console.error('Erreur diagnostic drinks', errDrinks);
          }
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du profil', err);
      } finally {
        setChargement(false);
      }
    };
    verifierProfil();
  }, [navigate]);

  if (chargement) return <div>Chgt</div>;
  return (
    <div className="page-accueil">
      <Navbar />
      {!configure ? (
        <Questionnaire onSave={(obj) => { setConfigure(true); if (obj && typeof obj === 'object') { setDemiVie(obj.demiVie); setSensibilite(obj.sensibilite); setHCoucher(obj.hCoucher); } else { setDemiVie(obj); } }} />
      ) : (
        <>
          <Graphique demiVie={demiVie} sensibilite={sensibilite} hCoucher={hCoucher} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1.3fr',
            gap: 32,
            alignItems: 'flex-start',
            marginTop: 24,
            marginBottom: 24
          }}>
            <div style={{ minWidth: 340 }}>
              <div style={{
                background: '#fffdfa',
                border: '1.5px solid #ffe0b2',
                borderRadius: 18,
                boxShadow: '0 2px 12px rgba(255, 200, 100, 0.07)',
                padding: 28,
                marginBottom: 24,
                minWidth: 320,
                maxWidth: 440
              }}>
                <p style={{ fontSize: '1em', color: '#7a5c2e', marginBottom: 10, marginTop: 0, fontWeight: 500 }}>
                  📝 Ajoutez vos consommations au fil de la journée pour mieux gérer votre sommeil et votre bien-être.
                </p>
                <AjoutConso />
              </div>
            </div>
            <Historique />
          </div>
        </>
      )}
    </div>
  );
}

export default Accueil;
