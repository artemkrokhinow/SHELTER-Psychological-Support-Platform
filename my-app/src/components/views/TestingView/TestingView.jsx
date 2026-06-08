import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { api } from '../../../infrastructure/api/api';

const TestingView = ({ 
    testStep, 
    setTestStep, 
    testAnswers, 
    setTestAnswers, 
    isTestFinished, 
    setIsTestFinished, 
    userId, 
    setResilience, 
    userStats, 
    setUserStats, 
    navigateTo,
    onFinish
}) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                let data = await api.getDiagnosticQuestions();
                
                
                if (!Array.isArray(data) || data.length < 7) {
                    await api.seedDiagnostics();
                    data = await api.getDiagnosticQuestions();
                }

                if (Array.isArray(data) && data.length > 0) {
                    setQuestions(data.map(q => ({
                        q: q.text,
                        options: q.options,
                        points: q.points
                    })));
                }
            } catch (err) {
                console.error("Error fetching or seeding questions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, []);

    const handleAnswer = (points) => {
      const newAnswers = [...testAnswers, points];
      setTestAnswers(newAnswers);
      if (testStep < questions.length - 1) setTestStep(testStep + 1);
      else {
        setIsTestFinished(true);
        setSaving(true);
        api.recordDiagnostic(userId, newAnswers)
          .then((res) => {
            setResult(res);
            if (onFinish) onFinish();
            if (userStats) {
              setUserStats({
                ...userStats,
                resilienceMultiplier: res.multiplier,
                diagnosticsTaken: {
                  ...userStats.diagnosticsTaken,
                  count: (userStats.diagnosticsTaken?.count || 0) + 1,
                  lastScore: res.score,
                  lastDate: new Date()
                }
              });
            }
          })
          .catch((err) => console.error('Error saving diagnostic:', err))
          .finally(() => setSaving(false));
      }
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <p className="text-slate-500 mb-6">Питання для діагностики не завантажені (база пуста).</p>
                <button 
                    onClick={() => {
                        setLoading(true);
                        api.seedDiagnostics()
                            .then(() => api.getDiagnosticQuestions())
                            .then(data => {
                                if (Array.isArray(data) && data.length > 0) {
                                    setQuestions(data.map(q => ({
                                        q: q.text,
                                        options: q.options,
                                        points: q.points
                                    })));
                                }
                            })
                            .catch(err => console.error("Error fetching seeded questions:", err))
                            .finally(() => setLoading(false));
                    }}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-2xl font-bold transition-all border border-emerald-500/30"
                >
                    Завантажити базові питання (Seed DB)
                </button>
            </div>
        );
    }

    if (isTestFinished) {
      if (saving || !result) {
        return (
          <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4 font-bold">Збереження результатів...</p>
          </div>
        );
      }

      const { score } = result;
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in duration-500 text-center">
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20"><CheckCircle2 size={48} className="text-[#0b0f1a]" /></div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">Діагностика завершена</h2>
          <p className="text-slate-400 mb-2 max-w-sm">Результат діагностики: <span className="text-emerald-400 font-black">{score}%</span></p>
          <p className="text-slate-500 mb-8 max-w-md text-sm leading-relaxed">
            Коефіцієнт нарахування балів оновлено.
            <br />
            До наступної діагностики ваші бали за вправи та практики будуть нараховуватися з новим коефіцієнтом.
          </p>
          <button onClick={() => navigateTo('stats')} className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-lg">Дивитися динаміку</button>
        </div>
      );
    }

    return (
      <div className="p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none text-left">Діагностика</h2>
          <div className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-2xl border border-slate-800 ">
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Питання {testStep + 1} з {questions.length}</span>
            <div className="flex gap-1">{questions.map((_, i) => <div key={i} className={`w-6 h-1.5 rounded-full transition-all ${i <= testStep ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>)}</div>
          </div>
        </div>
        <div className="max-w-3xl w-full mx-auto bg-slate-900/40 border border-slate-800 p-12 robust-rounded-48  shadow-2xl h-[550px] flex flex-col justify-start relative overflow-hidden">
           <div key={testStep} className="animate-in fade-in slide-in-from-right-8 duration-500 w-full h-full">
               <h3 className="text-2xl font-bold text-white mb-10 leading-tight text-left">{questions[testStep].q}</h3>
               <div className="grid grid-cols-1 gap-4">
                  {questions[testStep].options.map((opt, idx) => (
                    <button key={idx} onClick={() => handleAnswer(questions[testStep].points[idx])} className="flex items-center justify-between p-7 bg-slate-800/40 border border-slate-700 rounded-[32px] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left text-slate-300 hover:text-white font-bold group">
                      {opt} <ChevronRight size={18} className="text-slate-700 group-hover:text-emerald-500 transition-all" />
                    </button>
                  ))}
               </div>
           </div>
        </div>
      </div>
    );
};

export default TestingView;
