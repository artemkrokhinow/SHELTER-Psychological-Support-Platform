import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getDiagnosticResult } from '../../infrastructure/utils/diagnosticLogic';
import { api } from '../../infrastructure/api/api';

export default function SosPage() {
    const { answers } = useParams();
    const location = useLocation();
    
    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (userId) {
            api.updateResilience(userId, "sos_open", {}, "Сигнал гострої потреби (SOS)").catch(e => console.error(e));
        }
    }, []);
    
    const activeAnswers = answers || location.state?.answers;
    const View = getDiagnosticResult(activeAnswers);

    return (
        <div className="min-h-screen bg-[#070a12]">
            <View answers={activeAnswers} />
        </div>
    );
}