import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function Graphique({ sensibilite, demiVie: demiVieProp, hCoucher }) {
  const [drinks, setDrinks] = useState([]);
  const [demiVie, setDemiVie] = useState(5);
  const [chargement, setChargement] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem('userId');
      try { // on charge les conso de l'utilisateur depuis le backend
        const res = await fetch(`http://localhost:5050/api/drinks/${userId}`);
        const data = await res.json();
        setDrinks(data.drinks || []); 
        
        if (demiVieProp) setDemiVie(demiVieProp); 
      } catch (err) {
        console.log("Erreur de chargement", err);
      } finally {
        setChargement(false);
      }
    };
    fetchData();
  }, [demiVieProp]);

//fct de calulc
  const genererPoints = () => {
    const points = [];
    const sens = sensibilite || 2;
    const dvAjustee = demiVie / sens;

    // on veut 48 points (pour faire 24 heures par tranches de 30 min)
    for (let i = 0; i <= 48; i++) {
      // on crée un objet date pour "Maintenant"
      let momentVise = new Date();
      // on ajt les minutes i * 30 
      momentVise.setMinutes(momentVise.getMinutes() + (i * 30));

      let totalMg = 0;

      // pour chaque boisson, on regarde combien il reste 
      drinks.forEach(conso => {
        const doseInitiale = Number(conso.quantiteCafeine || conso.quantite || 0);
        const dateConso = new Date(conso.date || conso.createdAt);

        // calcul de la différence d'heures entre la boisson et le point sur le graphique
        const differenceEnMs = momentVise - dateConso;
        const heuresEcoulees = differenceEnMs / (1000 * 60 * 60); 

        if (heuresEcoulees >= 0) {
          // qté restante = Dose * 0.5 ^ (Temps / Demi-vie)
          const puissance = heuresEcoulees / dvAjustee;
          totalMg += doseInitiale * Math.pow(0.5, puissance);
        }
      });

      // affichage de l'h
      const label = momentVise.getHours() + "h" + (momentVise.getMinutes() || "00");

      points.push({
        heure: label,
        mg: Math.round(totalMg) // arrondi en entier pr simplifier
      });
    }
    return points;
  };

  const data = genererPoints();


  return (
    <section className="carte">
      <h3>Évolution de la caféine</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="heure" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="mg" stroke="#FF7043" fill="#FFCCBC" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}