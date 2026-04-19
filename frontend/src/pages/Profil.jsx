import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Questionnaire from './Questionnaire';

function Profil() {
  const navigate = useNavigate();
  return (
    <div className="page-accueil">
      <Navbar />
      <div style={{ padding: 16 }}>
        <h2>Mon Profil</h2>
        <Questionnaire onSave={() => navigate('/accueil')} />
      </div>
    </div>
  );
}

export default Profil;
