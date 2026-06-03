import React from 'react';
import BreathingExercise from '../../BreathingExercise/BreathingExercise';
import { api } from '../../../infrastructure/api/api';

const PracticeView = ({ userId, navigateTo, onFinish }) => {
    const handleFinishSession = (mins, cycles) => {
        if (mins > 0) {
            if (onFinish) onFinish();
            if (userId) {
                api.recordBreathingSession(userId, mins)
                    .catch((err) => console.error('Error saving breathing session:', err));
            }
        }
    };

    return (
        <BreathingExercise 
            onExit={() => navigateTo('home')}
            onFinishSession={handleFinishSession}
            title="Техніка дихання"
            showControls={true}
        />
    );
};

export default PracticeView;
