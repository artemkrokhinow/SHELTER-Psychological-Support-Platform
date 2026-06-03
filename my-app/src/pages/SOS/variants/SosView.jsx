import React from 'react';
import { useNavigate } from 'react-router-dom';
import BreathingExercise from '../../../components/BreathingExercise/BreathingExercise';
import { api } from '../../../infrastructure/api/api';

export default function SosView({ answers }) {
    const navigate = useNavigate();

    const handleFinishSession = async (mins, cycles) => {
        const userId = localStorage.getItem("userId");
        if (userId) {
            await api.updateResilience(userId, "sos", {}, "Техніка дихання (SOS)");
        }
        navigate("/main", { state: { fromSOS: true, helped: true } });
    };

    return (
        <div className="fixed inset-0 bg-[#070a12] z-50">
            <BreathingExercise 
                autoStart={false} 
                showControls={true}
                requireCycles={3}
                onFinishSession={handleFinishSession}
                onExit={() => navigate('/main')}
                title="Екстрена допомога"
            />
        </div>
    );
}
