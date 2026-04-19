import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import Card from '../components/Card';

export default function Graphique({ sensibilite, demiVie: demiVieProp, hCoucher }) {
const [drinks, setDrinks] = useState([]);
const [demiVie, setDemiVie] = useState(5);
// référence pour convertir mg -> nombre de tasses pour l'utilisateur
const STANDARD_COFFEE_MG = 80; // mg par "tasse" équivalente (modifiable)
const [chargement, setChargement] = useState(true); // état pour gérer le chargement des données
// Alerte si l'utilisateur enchaîne plusieurs prises rapprochées
const [showChainWarning, setShowChainWarning] = useState(false);
const [chainDetails, setChainDetails] = useState(null);
const chainTimerRef = useRef(null);

// timestamp "maintenant" mis à jour régulièrement pour afficher la ligne actuelle
const [nowTs, setNowTs] = useState(Date.now());
useEffect(() => {
	// DEBUG : log des consommations reçues pour diagnostic
	if (drinks && drinks.length) {
		console.log('Consommations reçues:', drinks.map(d => ({ nom: d.nomBoisson, date: d.date, createdAt: d.createdAt })));
	}
	const id = setInterval(() => setNowTs(Date.now()), 30000); // mise à jour toutes les 30s
	return () => clearInterval(id);
}, []);


const fetchData = useCallback(async () => {
setChargement(true);
const userId = localStorage.getItem('userId');
if (!userId) {
setDrinks([]);
setChargement(false);
return;
}

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
}, [demiVieProp]);

useEffect(() => {
fetchData();
window.addEventListener('drinks-updated', fetchData);
return () => window.removeEventListener('drinks-updated', fetchData);
}, [fetchData]);

// Détecter si l'utilisateur enchaîne des prises (ex: deux prises à moins d'1h)
useEffect(() => {
	// nettoyer ancien timer
	if (chainTimerRef.current) { clearTimeout(chainTimerRef.current); chainTimerRef.current = null; }

	if (!drinks || drinks.length < 2) {
		setShowChainWarning(false);
		setChainDetails(null);
		return;
	}

	// seuil (minutes) pour considérer deux prises comme "enchaînées"
	const CHAIN_THRESHOLD_MINUTES = 60; // 1 heure

	// Trie par createdAt (ordre d'ajout réel) — uniquement aujourd'hui
	const debutJournee = new Date();
	debutJournee.setHours(0, 0, 0, 0);
	const sortedByAjout = [...drinks]
	  .filter(d => d.createdAt && new Date(d.date || d.createdAt) >= debutJournee)
	  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

	let found = null;
	for (let i = 1; i < sortedByAjout.length; i++) {
		const prev = new Date(sortedByAjout[i-1].date || sortedByAjout[i-1].createdAt);
		const cur = new Date(sortedByAjout[i].date || sortedByAjout[i].createdAt);
		const diffMin = (cur - prev) / (1000 * 60);
		// Seulement si deux prises ajoutées consécutivement sont espacées de moins d'1h
		if (diffMin > 0 && diffMin < CHAIN_THRESHOLD_MINUTES) {
			found = { first: sortedByAjout[i-1], second: sortedByAjout[i], diffMin: Math.round(diffMin) };
			break;
		}
	}

	if (found) {
		setChainDetails(found);
		setShowChainWarning(true);
		chainTimerRef.current = setTimeout(() => setShowChainWarning(false), 8000);
	} else {
		setShowChainWarning(false);
		setChainDetails(null);
	}

	return () => { if (chainTimerRef.current) { clearTimeout(chainTimerRef.current); chainTimerRef.current = null; } };
}, [drinks]);

//fct de calulc
const SAMPLE_MINUTES = 30; // granularité des points (minutes)
const genererPoints = () => {
const points = [];
const sens = sensibilite || 2;
const dvAjustee = demiVie;

// Plage du graphique : de -12h à +12h autour de maintenant (soit 24h au total)
// nombre de pas pour 24h = (24*60) 
const stepsPerDay = (24 * 60) / SAMPLE_MINUTES;
// boucle de -stepsPerDay/2 à +stepsPerDay/2 (0 = maintenant)
for (let i = -stepsPerDay/2; i <= stepsPerDay/2; i++) {
	// on crée un objet date pour "Maintenant"
	let momentVise = new Date();
	// on ajoute les minutes i * SAMPLE_MINUTES (i peut être négatif pour le passé)
	momentVise.setMinutes(momentVise.getMinutes() + (i * SAMPLE_MINUTES));

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

// affichage de l'heure et timestamp — arrondir l'affichage au quart d'heure le plus proche
const pad = (n) => String(n).padStart(2, '0');
let roundedMinutes = Math.round(momentVise.getMinutes() / 15) * 15;
let displayHour = momentVise.getHours();
if (roundedMinutes === 60) {
roundedMinutes = 0;
displayHour = (displayHour + 1) % 24;
}
const label = `${displayHour}h${pad(roundedMinutes)}`;

// Ne pas arrondir ici pour éviter les "plateaux" 
// Si on arrondit (par ex. Math.round ou toFixed(1)) la valeur mg,
// les petites diminutions entre deux points peuvent disparaître
// -> crée des paliers sur le graphique
// On stocke donc la valeur brute (float) pour le rendu. 
points.push({
heure: label,
mg: totalMg, // valeur non arrondie pour éviter les plateaux
ts: momentVise.getTime()
});
}
return points;
};

const calculerCafeineAuCoucher = () => {
if (!hCoucher) return null;

const [heures, minutes] = hCoucher.split(':').map(Number);
const dateCoucher = new Date();
dateCoucher.setHours(heures, minutes, 0, 0);

// Si l'heure du coucher est déjà passée aujourd'hui, on vise demain
if (dateCoucher < new Date()) {
dateCoucher.setDate(dateCoucher.getDate() + 1);
}

let totalCoucher = 0;
const dvAjustee = demiVie;

// 2. On refait le même calcul que pour le graphique, mais que pour cette date
drinks.forEach(conso => {
const doseInitiale = Number(conso.quantiteCafeine || conso.quantite || 0);
const dateConso = new Date(conso.date || conso.createdAt);
const heuresEcoulees = (dateCoucher - dateConso) / (1000 * 60 * 60);
if (heuresEcoulees >= 0) {
totalCoucher += doseInitiale * Math.pow(0.5, heuresEcoulees / dvAjustee);
}
});

return Math.round(totalCoucher);
};
const formatCups = (mgValue) => {
  const cups = Math.round(mgValue / STANDARD_COFFEE_MG);
  return `${cups} tasse${cups > 1 ? 's' : ''}`;
};

const obtenirConseil = (mgAuCoucher) => {
  if (mgAuCoucher === null || mgAuCoucher === undefined) {
    return { level: 'Neutre', msg: 'Pas assez de données', color: '#9CA3AF' };
  }
  if (mgAuCoucher <= 20) {
    return { level: 'Bon (1) ', msg: 'Votre sommeil ne devrait pas être affecté', color: '#10B981' };
  }
  if (mgAuCoucher <= 40) {
    return { level: 'Attention (2)', msg: 'Un peu de caféine reste, votre sommeil peut être léger', color: '#F59E0B' };
  }
  return { level: 'Élevé (3)', msg: 'Trop de caféine pour un sommeil optimal', color: '#EF4444' };
};

const mgAuCoucher = calculerCafeineAuCoucher();
const conseil = obtenirConseil(mgAuCoucher);

// détecter si on est en "fin de journée" (après 19h local)
const maintenant = new Date();
const isFinDeJournee = maintenant.getHours() >= 19;

const data = genererPoints();

const chartWrapperRef = useRef(null);
const POINT_PX = 28; // 
const minChartWidth = 800;
const chartWidth = Math.max(data.length * POINT_PX, minChartWidth);
// intervalle d'affichage des labels (toutes les 2h => nombre d'étapes à sauter)
const TICK_INTERVAL_INDEX = Math.max(0, Math.floor((2 * 60) / SAMPLE_MINUTES) - 1);

useEffect(() => {
	if (!chartWrapperRef.current || !data || data.length === 0) return;
	const nowTs = Date.now();
	let bestIdx = data.findIndex(p => p.ts >= nowTs);
	if (bestIdx === -1) bestIdx = Math.floor(data.length / 2);
	const container = chartWrapperRef.current;
	const targetX = bestIdx * POINT_PX;
	const scrollLeft = Math.max(0, targetX - (container.clientWidth / 2));
	setTimeout(() => { container.scrollLeft = scrollLeft; }, 0);
}, [data]);

const mgActuelle = (() => {
const maintenant = new Date();
const dvAjustee = demiVie;
let total = 0;
drinks.forEach(conso => {
const doseInitiale = Number(conso.quantiteCafeine || conso.quantite || 0);
const dateConso = new Date(conso.date || conso.createdAt);
const heuresEcoulees = (maintenant - dateConso) / (1000 * 60 * 60);
if (heuresEcoulees >= 0) {
total += doseInitiale * Math.pow(0.5, heuresEcoulees / dvAjustee);
}
});
return Math.round(total);
})();

const totalAujourdHui = (() => {
const debutJournee = new Date();
debutJournee.setHours(0,0,0,0);
let total = 0;
drinks.forEach(conso => {
const doseInitiale = Number(conso.quantiteCafeine || conso.quantite || 0);
const dateConso = new Date(conso.date || conso.createdAt);
if (dateConso >= debutJournee) total += doseInitiale;
});
return Math.round(total);
})();

// trouver l'index le plus proche pour l'heure de coucher dans les points générés
const trouverIndexCoucher = () => {
if (!hCoucher || !data || data.length === 0) return null;
// construire une Date cible pour l'heure de coucher (aujourd'hui ou demain si déjà passée)
const [hc, mc] = hCoucher.split(':').map(Number);
const cible = new Date();
cible.setHours(hc, mc, 0, 0);
if (cible < new Date()) cible.setDate(cible.getDate() + 1);
const cibleTs = cible.getTime();

let bestIdx = null;
let bestDiff = Infinity;
data.forEach((p, idx) => {
const diff = Math.abs(p.ts - cibleTs);
if (diff < bestDiff) { bestDiff = diff; bestIdx = idx; }
});
return bestIdx;
};
const idxCoucher = trouverIndexCoucher();
const seuilCritique = 50; // mg pour la ligne de seuil (ajustable)

// calcul du timestamp cible pour l'heure de coucher (aujourd'hui ou demain si l'heure est passée)
const cibleTs = (() => {
if (!hCoucher) return null;
const [hc, mc] = hCoucher.split(':').map(Number);
const cible = new Date();
cible.setHours(hc, mc, 0, 0);
if (cible < new Date()) cible.setDate(cible.getDate() + 1);
return cible.getTime();
})();


return (
<Card as="section" title="Évolution de la caféine">

{showChainWarning && chainDetails && (
	<div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: '#FFF4E6', border: '1px solid #FFD8A8', color: '#7A4225', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
		<div style={{ lineHeight: 1.2 }}>
			<strong>⚠️ Attention</strong>
			<div style={{ fontSize: 13 }}>
				Vous avez enchaîné deux prises en moins d'une heure. Si vous êtes sensible à la caféine, cela peut perturber votre sommeil.
			</div>
		</div>
		<div style={{ marginLeft: 12 }}>
			<button onClick={() => setShowChainWarning(false)} style={{ background: '#7A4225', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6 }}>Fermer</button>
		</div>
	</div>
)}

<div style={{ display: 'flex', gap: 16, margin: '12px 0 18px' }}>
<div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
<div>
<div style={{ fontSize: 13, color: '#374151' }}>Caféine actuelle</div>
<div style={{ marginTop: 6, fontSize: 26, fontWeight: 800, color: '#4f46e5' }}>{mgActuelle} <span style={{ fontSize: 15, fontWeight: 700, color: '#6b7280' }}>mg</span></div>
<div style={{ marginTop: 6, fontSize: 12, color: '#0f172a' }}>{formatCups(mgActuelle)}</div>
</div>
<div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(180deg,#EEF2FF,#EDE9FE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h14v5a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7z" stroke="#4f46e5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 8v3a3 3 0 0 1-3 3" stroke="#4f46e5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
</div>
</div>

<div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
<div>
<div style={{ fontSize: 13, color: '#374151' }}>Total aujourd'hui</div>
<div style={{ marginTop: 6, fontSize: 26, fontWeight: 800, color: '#ec4899' }}>{totalAujourdHui} <span style={{ fontSize: 15, fontWeight: 700, color: '#6b7280' }}>mg</span></div>
<div style={{ marginTop: 6, fontSize: 12, color: '#0f172a' }}>{formatCups(totalAujourdHui)}</div>
</div>
<div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(180deg,#FFF1F7,#FFF0F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#ec4899" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 2v4M16 2v4" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 11h10M7 15h6" stroke="#ec4899" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
</div>
</div>

<div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
<div>
<div style={{ fontSize: 13, color: '#374151' }}>Au coucher</div>
<div style={{ marginTop: 6, fontSize: 26, fontWeight: 800, color: '#06b6d4' }}>{mgAuCoucher !== null ? mgAuCoucher : '-'} <span style={{ fontSize: 15, fontWeight: 700, color: '#6b7280' }}>mg</span></div>
<div style={{ marginTop: 6, fontSize: 12, color: '#0f172a' }}>{mgAuCoucher !== null ? `${formatCups(mgAuCoucher)} approximativement` : ''}</div>
</div>
<div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(180deg,#ECFEFF,#E0F2FE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="#06b6d4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
</div>
</div>
</div>
{hCoucher && mgAuCoucher !== null && (
<div style={{
padding: '10px',
marginBottom: '15px',
borderRadius: '8px',
border: `2px solid ${conseil.color}`,
backgroundColor: `${conseil.color}11` // Fond très clair
}}>
<p style={{ margin: 0, fontWeight: 'bold', color: conseil.color }}>
{conseil && (`Niveau ${conseil.level} — ${conseil.msg}`)}
</p>
<small>Estimation à {hCoucher} : <strong>{mgAuCoucher} mg</strong> restant (~{formatCups(mgAuCoucher)}).</small>
{(mgAuCoucher <= 20) && (
(() => {
const remainingMg = Math.max(0, Math.round(seuilCritique - mgAuCoucher));
const remainingCups = Math.round(remainingMg / STANDARD_COFFEE_MG);
if (remainingMg <= 0) return <div style={{ marginTop: 8, color: '#0f172a' }}>Aucune consommation supplémentaire recommandée avant le coucher.</div>;
return (
<div style={{ marginTop: 8, color: '#0f172a' }}>
Vous pouvez encore consommer jusqu'à <strong>{remainingMg} mg</strong> (~{formatCups(remainingMg)}) sans affecter votre sommeil.
</div>
);
})()
)}
</div>
)}

{/* boissons suggérées */}
{hCoucher && mgAuCoucher !== null && (
(() => {
const catalogue = [
{ name: 'Café filtre', mg: 95 },
{ name: 'Espresso', mg: 63 },
{ name: 'Thé vert', mg: 28 },
{ name: 'Décaféiné', mg: 3 }
];

const SEUIL_BAS = 20;
const SEUIL_HAUT = 40;

// temps restant jusqu'au coucher 
const [hc, mc] = hCoucher.split(':').map(Number);
const now = new Date();
const bed = new Date();
bed.setHours(hc, mc, 0, 0);
if (bed <= now) bed.setDate(bed.getDate() + 1);
const hoursToBed = (bed - now) / (1000 * 60 * 60);

const dvAjustee = demiVie;
const decayFactor = Math.pow(0.5, hoursToBed / dvAjustee);

const safe = [];
const caution = [];
const avoid = [];

catalogue.forEach(d => {
const addedAtBed = d.mg * decayFactor;
const projected = mgAuCoucher + addedAtBed;
if (projected <= SEUIL_BAS) safe.push({ ...d, projected: Math.round(projected) });
else if (projected <= SEUIL_HAUT) caution.push({ ...d, projected: Math.round(projected) });
else avoid.push({ ...d, projected: Math.round(projected) });
});

// Si beaucoup de temps avant le coucher (>8h), tout est ok → message positif
if (hoursToBed > 8 && avoid.length === 0) {
return (
	<div style={{ marginBottom: 14 }}>
		<div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: 14 }}>
			<div style={{ fontSize: 16, fontWeight: 700, color: '#065F46', marginBottom: 6 }}>☀️ C'est le bon moment !</div>
			<div style={{ color: '#374151', fontSize: 13 }}>Vous êtes loin de l'heure du coucher, vous pouvez consommer librement.</div>
		</div>
	</div>
);
}

return (
	<div style={{ marginBottom: 14 }}>
		<div style={{ background: '#EEF6FF', border: '1px solid #E3EEFF', borderRadius: 12, padding: 14 }}>
			<div style={{ fontSize: 16, fontWeight: 700, color: '#0B1220', marginBottom: 10 }}>💡 Suggestions</div>

			{/* boissons recommandées */}
			{safe.length > 0 && (
				<div style={{ marginBottom: 10 }}>
					<div style={{ color: '#065F46', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>✅ Vous pouvez consommer :</div>
					<ul style={{ paddingLeft: 18, margin: 0 }}>
						{safe.map(s => <li key={s.name} style={{ fontSize: 13, color: '#374151' }}>{s.name} ({s.projected} mg au coucher)</li>)}
					</ul>
				</div>
			)}

			{/* boissons avec modération */}
			{caution.length > 0 && (
				<div style={{ marginBottom: 10 }}>
					<div style={{ color: '#92400E', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>⚠️ Avec modération :</div>
					<ul style={{ paddingLeft: 18, margin: 0 }}>
						{caution.map(s => <li key={s.name} style={{ fontSize: 13, color: '#374151' }}>{s.name} ({s.projected} mg au coucher)</li>)}
					</ul>
				</div>
			)}

			{/* boissons à éviter */}
			{avoid.length > 0 && (
				<div>
					<div style={{ color: '#991B1B', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>❌ À éviter :</div>
					<ul style={{ paddingLeft: 18, margin: 0 }}>
						{avoid.map(s => <li key={s.name} style={{ fontSize: 13, color: '#374151' }}>{s.name} ({s.projected} mg au coucher)</li>)}
					</ul>
				</div>
			)}
		</div>
	</div>
);
})()
)}

{/* Suggestion en fin de journée (après 19h) */}
{isFinDeJournee && (
<div style={{ background: '#EBF5FF', border: "1px solid #D9EEF9", padding: 14, borderRadius: 10, marginBottom: 14 }}>
<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
<div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(180deg,#F3F9FF,#EBF5FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
	<circle cx="12" cy="12" r="9" stroke="#0EA5E9" strokeWidth="1.4" />
	<path d="M12 7v5l4 2" stroke="#0EA5E9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
</svg>
</div>

<div>
<div style={{ fontWeight: 800, color: '#0F172A', fontSize: 16 }}>Fin de journée</div>
<div style={{ color: '#334155', marginTop: 6 }}>Privilégiez des boissons décaféinées ou sans caféine pour préserver votre sommeil.</div>
</div>
</div>
</div>
)}

	<div ref={chartWrapperRef} style={{ width: '100%', overflowX: 'auto' }}>
		<div style={{ minWidth: chartWidth, height: 380, position: 'relative', paddingRight: 24 }}>
			<ResponsiveContainer width={chartWidth} height="100%">
				<AreaChart data={data} margin={{ top: 60, right: 48, left: 0, bottom: 40 }}>
<CartesianGrid strokeDasharray="6 6" vertical={true} stroke="rgba(16,24,40,0.06)" />
<XAxis xAxisId="time" dataKey="ts" type="number" domain={["dataMin", "dataMax"]} hide />

	<XAxis
		dataKey="heure"
		interval={TICK_INTERVAL_INDEX} /* afficher un label toutes les 2h */
		label={{ value: 'Heure (h)', position: 'bottom', dy: 10 }}
		stroke="#374151"
		tick={{ fill: '#374151' }}
	/>
<YAxis
label={{ value: 'Caféine (mg)', angle: -90, position: 'insideLeft', offset: 10 }}
stroke="#374151"
tick={{ fill: '#374151' }}
/>
				<Tooltip
					formatter={(value) => {
						// Arrondir les mg pour l'affichage au survol.
						// Si la valeur est non nulle mais < 1, afficher "<1 mg" pour plus de sens.
						const num = Number(value || 0);
						const rounded = Math.round(num);
						return rounded === 0 && num > 0 ? '<1 mg' : `${rounded} mg`;
					}}
					labelFormatter={(label) => {
						if (typeof label === 'number') {
							const d = new Date(label);
							const pad = (n) => String(n).padStart(2, '0');
							return `Heure: ${d.getHours()}h${pad(d.getMinutes())}`;
						}
						return `Heure: ${label}`;
					}}
				/>

<Area type="monotone" dataKey="mg" stroke="#FF7043" fill="#FFCCBC" fillOpacity={0.6} />

<ReferenceLine y={seuilCritique} stroke="#ef5350" strokeDasharray="6 6" />
{cibleTs && (
<ReferenceLine
xAxisId="time"
x={cibleTs}
stroke="#6b7280" 
strokeDasharray={""} 
strokeWidth={4}
label={{ value: 'Coucher', position: 'right', fill: '#111827', fontWeight: 700 }}
/>
)}
{nowTs && (
	<ReferenceLine
		xAxisId="time"
		x={nowTs}
		stroke="#06b6d4"
		strokeWidth={2}
		label={{ value: 'Maintenant', position: 'top', fill: '#075985', fontWeight: 700 }}
	/>
)}
				</AreaChart>
			</ResponsiveContainer>
		</div>
	</div>

<div className="chart-legend" style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 12 }}>
<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
<div style={{ width: 16, height: 16, borderRadius: 6, background: '#FF7043' }} />
<div style={{ color: '#444' }}>Taux de caféine</div>
</div>


<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
<svg width="44" height="12" viewBox="0 0 44 12" xmlns="http://www.w3.org/2000/svg" aria-hidden>
<line x1="0" y1="6" x2="44" y2="6" stroke="#ef5350" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />
</svg>
<div style={{ color: '#444' }}>Seuil critique</div>
</div>
</div>
</Card>
);
}
