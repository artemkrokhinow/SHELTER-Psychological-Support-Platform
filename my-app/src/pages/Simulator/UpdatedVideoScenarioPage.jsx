import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../infrastructure/api/api";
import CharacterCompanion from "../../components/characterCompanion/CharacterCompanion";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, RotateCcw, FileText, Trophy, Clock } from 'lucide-react';
import "./updatedVideoScenarioPage.css";

export default function UpdatedVideoScenarioPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [scenario, setScenario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showCompletionMenu, setShowCompletionMenu] = useState(false);
    const [score, setScore] = useState(0);
    const [watchTime, setWatchTime] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const sessionStartTime = useRef(Date.now());
        
    useEffect(() => {
        const timer = setInterval(() => {
            if (isPlaying) {
                setWatchTime(prev => prev + 1);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying]);

    useEffect(() => {
        if (!id || id === 'null') return;
        api.getScenarioById(id)
            .then((data) => {
                if (data && !data.message) {
                    setScenario(data);
                } else {
                    setScenario(null);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const toggleVideo = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleVideoProgress = () => {
        if (videoRef.current) {
            const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(currentProgress);
        }
    };

    const handleVideoLoaded = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleVideoEnd = () => {
        setIsPlaying(false);
        setIsCompleted(true);
        setScore(Math.min(100, Math.round((watchTime / duration) * 100)));
        setTimeout(() => setShowCompletionMenu(true), 1000);
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        
        if (videoRef.current) {
            videoRef.current.currentTime = (percentage / 100) * videoRef.current.duration;
            setProgress(percentage);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current?.parentElement?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const changePlaybackSpeed = () => {
        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const currentIndex = speeds.indexOf(playbackSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setPlaybackSpeed(nextSpeed);
        
        if (videoRef.current) {
            videoRef.current.playbackRate = nextSpeed;
        }
    };

    const resetVideo = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            setProgress(0);
            setWatchTime(0);
            setIsCompleted(false);
        }
    };

    const handleComplete = (userScore) => {
        const finalScore = Math.round((score + userScore) / 2);
        api.completeScenario(id, finalScore)
            .then(() => {
                const userId = localStorage.getItem("userId");
                if (userId) {
                    api.updateResilience(userId, "video_complete", { score: finalScore }, scenario.name);
                }
                navigate('/exercises');
            })
            .catch(() => {
                navigate('/exercises');
            });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="dr-updated-video-layout">
            <div className="dr-loading-container">
                <div className="dr-loading-spinner"></div>
                <h2>Завантаження...</h2>
            </div>
        </div>
    );

    return (
        <div className="dr-updated-video-layout">
            {}
            <header className="dr-video-header">
                <div className="dr-header-content">
                    <button className="dr-back-btn" onClick={() => navigate("/exercises")}>
                        <ArrowLeft size={20} />
                        <span>До вправ</span>
                    </button>
                    
                    <div className="dr-header-info">
                        <h1 className="dr-scenario-title">{scenario?.name}</h1>
                        <div className="dr-video-meta">
                            <span className="dr-video-category">{scenario?.category || 'Відео тренування'}</span>
                            <span className="dr-video-duration">
                                <Clock size={14} />
                                {scenario?.duration || formatTime(duration)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="dr-header-stats">
                        <div className="dr-stat-item">
                            <Trophy size={16} />
                            <span>{score}%</span>
                        </div>
                        <div className="dr-stat-item">
                            <Clock size={16} />
                            <span>{formatTime(watchTime)}</span>
                        </div>
                    </div>
                </div>
            </header>

            {}
            <main className="dr-video-main">
                <div className="dr-video-container">
                    {}
                    <div className="dr-video-player-wrapper">
                        <video
                            ref={videoRef}
                            className="dr-video-player"
                            src={scenario?.videoUrl}
                            onTimeUpdate={handleVideoProgress}
                            onLoadedMetadata={handleVideoLoaded}
                            onEnded={handleVideoEnd}
                            onClick={toggleVideo}
                            preload="metadata"
                        />
                        
                        {}
                        <div className="dr-video-overlay">
                            {!isPlaying && (
                                <button className="dr-video-play-btn" onClick={toggleVideo}>
                                    <Play fill="white" size={64} />
                                </button>
                            )}
                            
                            {isCompleted && (
                                <div className="dr-completed-overlay">
                                    <div className="dr-completed-icon">✓</div>
                                    <span>Відео завершено</span>
                                </div>
                            )}
                        </div>
                        
                        {}
                        <div className="dr-video-controls">
                            <div className="dr-controls-left">
                                <button className="dr-control-btn" onClick={toggleVideo}>
                                    {isPlaying ? <Pause fill="white" /> : <Play fill="white" />}
                                </button>
                                
                                <div className="dr-volume-control">
                                    <button className="dr-control-btn" onClick={toggleMute}>
                                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="dr-volume-slider"
                                    />
                                </div>
                                
                                <span className="dr-time-display">
                                    {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                                </span>
                            </div>
                            
                            <div className="dr-controls-center">
                                <div className="dr-progress-container" onClick={handleSeek}>
                                    <div className="dr-progress-bar">
                                        <div 
                                            className="dr-progress-fill" 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                        <div 
                                            className="dr-progress-handle" 
                                            style={{ left: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="dr-controls-right">
                                <button 
                                    className="dr-control-btn" 
                                    onClick={changePlaybackSpeed}
                                    title={`Швидкість: ${playbackSpeed}x`}
                                >
                                    {playbackSpeed}x
                                </button>
                                
                                <button className="dr-control-btn" onClick={resetVideo}>
                                    <RotateCcw size={20} />
                                </button>
                                
                                <button className="dr-control-btn" onClick={toggleFullscreen}>
                                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="dr-video-content">
                        <div className="dr-video-description">
                            <h3>
                                <FileText size={18} />
                                Опис сценарію
                            </h3>
                            <p>{scenario?.description || "Перегляньте відео та дотримуйтесь інструкцій для ефективного тренування."}</p>
                        </div>

                        <div className="dr-transcript-section">
                            <button 
                                className="dr-transcript-toggle"
                                onClick={() => setShowTranscript(!showTranscript)}
                            >
                                <FileText size={18} />
                                {showTranscript ? "Приховати транскрипцію" : "Показати транскрипцію"}
                            </button>
                            
                            {showTranscript && (
                                <div className="dr-transcript-content">
                                    <h3>
                                        <FileText size={18} />
                                        Транскрипція відео
                                    </h3>
                                    <div 
                                        className="dr-transcript-text"
                                        dangerouslySetInnerHTML={{ __html: scenario?.videoTranscript || 'Транскрипція недоступна для цього відео.' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {}
            {}

            {}
            {showCompletionMenu && (
                <div className="dr-completion-overlay">
                    <div className="dr-completion-card">
                        <div className="dr-completion-header">
                            <div className="dr-completion-icon">🎬</div>
                            <h2>Відео завершено!</h2>
                            <p>Дякуємо за перегляд. Оцініть ефективність тренування.</p>
                        </div>
                        <div className="dr-completion-stats">
                            <div className="dr-stat-row">
                                <span>Час перегляду:</span>
                                <span>{formatTime(watchTime)}</span>
                            </div>
                            <div className="dr-stat-row">
                                <span>Прогрес:</span>
                                <span>{score}%</span>
                            </div>
                        </div>
                        <div className="dr-completion-actions">
                            <button 
                                className="dr-completion-btn excellent" 
                                onClick={() => handleComplete(100)}
                            >
                                😊 Дуже ефективно
                            </button>
                            <button 
                                className="dr-completion-btn good" 
                                onClick={() => handleComplete(75)}
                            >
                                😐 Середньо
                            </button>
                            <button 
                                className="dr-completion-btn poor" 
                                onClick={() => handleComplete(50)}
                            >
                                😔 Мало ефективно
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
