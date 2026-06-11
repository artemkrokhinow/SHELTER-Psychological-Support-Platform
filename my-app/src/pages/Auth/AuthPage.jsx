import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../../infrastructure/api/api';
import { ShieldCheck, Mail, Lock, User, ChevronLeft, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import HoldSOSButton from '../../components/HoldSOSButton/HoldSOSButton';
import SOSOverlay from '../../components/SOSOverlay/SOSOverlay';
import BreathingExercise from '../../components/BreathingExercise/BreathingExercise';

export default function AuthPage() {
    const { t } = useTranslation();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ email: '', password: '', username: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [showSOS, setShowSOS] = useState(false);
    const [showBreathing, setShowBreathing] = useState(false);
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setError('');
        try {
            const data = await api.googleLogin(credentialResponse.credential);
            if (data.token && data.user) {
                localStorage.setItem("dr_token", data.token);
                localStorage.setItem("userId", data.user.id);
                localStorage.setItem("dr_current_view", "home");
                navigate('/main');
            } else {
                setError(data.message || t('auth.google_error'));
            }
        } catch (err) {
            console.error('Google Auth Error:', err);
            setError(t('auth.google_try_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSosClick = () => {
        setShowSOS(true);
    };

    const handlePracticeClick = async () => {
        setShowSOS(false);
        setShowBreathing(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            let data;
            
            if (isLogin) {
                data = await api.login(formData);
            } else {
                const wasGuest = localStorage.getItem("dr_token") === "guest_mode";
                if (wasGuest) {
                    data = await api.migrateGuest(formData);
                } else {
                    data = await api.register(formData);
                }
            }
            
            if (data.token && data.user) {
                localStorage.setItem("dr_token", data.token);
                localStorage.setItem("userId", data.user.id);
                localStorage.setItem("dr_current_view", "home");
                navigate('/main');
            } else {
                setError(data.message || t('auth.auth_error'));
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || t('auth.server_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setError('');
        setIsLoading(true);
        
        try {
            const data = await api.loginAsGuest();
            if (data.id || data.user) {
                localStorage.setItem("dr_token", "guest_mode");
                localStorage.setItem("dr_current_view", "home");
                navigate('/main');
            } else {
                setError(data.message || t('auth.guest_error'));
            }
        } catch (err) {
            console.error('Guest login error:', err);
            setError(err.message || t('auth.guest_error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 relative overflow-hidden transition-opacity duration-500"
            style={{ opacity: isLeaving ? 0 : 1 }}
        >
            {}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            {}


            {}
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                {}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#0b0f1a] shadow-2xl shadow-white/10 mb-5">
                        <ShieldCheck size={36} />
                    </div>
                    <span className="text-3xl font-black text-white italic uppercase tracking-tighter font-montserrat">Shelter</span>
                    <p className="text-slate-500 text-sm mt-1 font-medium font-comfortaa">{t('auth.tagline')}</p>
                </div>

                {}
                <div className="bg-slate-900/60 border border-slate-800 rounded-[40px] p-8  shadow-2xl">
                    {}
                    <div className="flex bg-slate-800/50 rounded-2xl p-1 mb-8">
                        <button
                            onClick={() => { setIsLogin(true); setError(''); }}
                            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest font-montserrat transition-all duration-300 ${
                                isLogin
                                    ? 'bg-emerald-500 text-[#0b0f1a] shadow-lg shadow-emerald-500/20'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {t('auth.login')}
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setError(''); }}
                            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest font-montserrat transition-all duration-300 ${
                                !isLogin
                                    ? 'bg-emerald-500 text-[#0b0f1a] shadow-lg shadow-emerald-500/20'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {t('auth.register')}
                        </button>
                    </div>

                    {}
                    {error && (
                        <div className="mb-6 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm font-medium animate-in fade-in duration-300 font-quicksand">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder={t('auth.username')}
                                    value={formData.username}
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                    required
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-slate-800/80 transition-all font-comfortaa"
                                />
                            </div>
                        )}
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-slate-800/80 transition-all font-comfortaa"
                            />
                        </div>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="password"
                                placeholder={t('auth.password')}
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-slate-800/80 transition-all font-comfortaa"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0b0f1a] py-4 rounded-2xl font-black text-sm uppercase tracking-widest font-montserrat shadow-xl shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading
                                ? (isLogin ? t('auth.signing_in') : t('auth.creating'))
                                : (isLogin ? t('auth.login') : t('auth.create_account'))
                            }
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-slate-600 text-xs font-bold uppercase tracking-widest font-montserrat">{t('auth.or_sign_in_via')}</span>
                        <div className="flex-1 h-px bg-slate-800" />
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError(t('auth.google_error'))}
                                theme="filled_blue"
                                shape="pill"
                                text="continue_with"
                                width="100%"
                            />
                        </div>

                        <button
                            onClick={handleGuestLogin}
                            disabled={isLoading}
                            className="w-full bg-transparent border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest font-montserrat transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Sparkles size={16} />
                            {t('auth.guest_mode')}
                        </button>
                    </div>
                </div>

                {}
                <div className="mt-8 text-center">
                    <HoldSOSButton onActivate={handleSosClick}>
                        {t('auth.sos_help')}
                    </HoldSOSButton>
                </div>
            </div>

            {showSOS && !showBreathing && (
                <SOSOverlay 
                    onClose={() => setShowSOS(false)} 
                    onPracticeClick={handlePracticeClick} 
                />
            )}

            {showBreathing && (
                <BreathingExercise 
                    onExit={() => setShowBreathing(false)}
                    autoStart={true}
                    title={t('auth.breathing_technique')}
                    showControls={true}
                />
            )}
        </div>
    );
}
