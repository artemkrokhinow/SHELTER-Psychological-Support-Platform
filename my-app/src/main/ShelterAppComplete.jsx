import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertCircle, ChevronLeft, FileText, Headphones, Video, Wind, X
} from 'lucide-react';

import '../infrastructure/assets/styles/index-tailwind.css';
import '../pages/Simulator/simulatorPage.css';
import { api, API_URL } from '../infrastructure/api/api';
import { io } from 'socket.io-client';
import CharacterCompanion from '../components/characterCompanion/CharacterCompanion';


import MainChat from '../components/MainChat/MainChat';
import MistakesAnalysis from '../components/MainChat/MistakesAnalysis';
import MainSidebar from '../components/MainSidebar/MainSidebar';
import MainHeader from '../components/MainHeader/MainHeader';
import HomeView from '../components/views/HomeView/HomeView';


const LibraryView = React.lazy(() => import('../components/views/LibraryView/LibraryView'));
const QuestsView = React.lazy(() => import('../components/views/QuestsView/QuestsView'));
const TestingView = React.lazy(() => import('../components/views/TestingView/TestingView'));
const StatsView = React.lazy(() => import('../components/views/StatsView/StatsView'));
const PracticeView = React.lazy(() => import('../components/views/PracticeView/PracticeView'));
const AdviceView = React.lazy(() => import('../components/views/AdviceView/AdviceView'));
const DiaryView = React.lazy(() => import('../components/views/DiaryView/DiaryView'));


const SimulatorPage = React.lazy(() => import('../pages/Simulator/SimulatorPage'));
const UpdatedFindDifferencesPage = React.lazy(() => import('../pages/Simulator/UpdatedFindDifferencesPage'));
const UpdatedSortingPage = React.lazy(() => import('../pages/Simulator/UpdatedSortingPage'));







const ShelterAppComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isGuest = localStorage.getItem("dr_token") === "guest_mode";
  const [currentView, setCurrentView] = useState(() => {
    const saved = localStorage.getItem('dr_current_view');
    return saved || 'home';
  });
  
  useEffect(() => {
    if (currentView) {
      localStorage.setItem('dr_current_view', currentView);
    }
  }, [currentView]);

  const [visitedViews, setVisitedViews] = useState([currentView]);
  const [tourStep, setTourStep] = useState(localStorage.getItem('dr_tour_step') || '0');
  const [isChatMode, setIsChatMode] = useState(false);
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  const [isFindDifferencesMode, setIsFindDifferencesMode] = useState(false);
  const [isSortingMode, setIsSortingMode] = useState(false);
  const [showSOS, setShowSOS] = useState(location.state?.showSOS || false);
  const [showSOSPhones, setShowSOSPhones] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem('dr_search_term') || '');
  const [libraryFilter, setLibraryFilter] = useState(() => sessionStorage.getItem('dr_library_filter') || 'Всі');

  useEffect(() => {
    sessionStorage.setItem('dr_search_term', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    sessionStorage.setItem('dr_library_filter', libraryFilter);
  }, [libraryFilter]);


  const [testStep, setTestStep] = useState(0);
  const [testAnswers, setTestAnswers] = useState([]);
  const [isTestFinished, setIsTestFinished] = useState(false);

  
  const [simulatorScenarioId, setSimulatorScenarioId] = useState(null);
  const [simulatorScenariosList, setSimulatorScenariosList] = useState([]);

  
  const [mediaLibraryData, setMediaLibraryData] = useState([]);
  const [resilience, setResilience] = useState(50);
  const [resilienceMultiplier, setResilienceMultiplier] = useState(1.0);
  const [userStats, setUserStats] = useState(null);
  const [streak, setStreak] = useState(0);
  const [currentMood, setCurrentMood] = useState(() => localStorage.getItem('dr_current_mood') || null);
  
  useEffect(() => {
    if (currentMood) {
      localStorage.setItem('dr_current_mood', currentMood);
    } else {
      localStorage.removeItem('dr_current_mood');
    }
  }, [currentMood]);
  
  
  const rawUserId = localStorage.getItem("userId");
  const initialUserId = (rawUserId === "null" || rawUserId === "undefined") ? null : rawUserId;
  const [userId, setUserId] = useState(initialUserId);

  const initialUsername = localStorage.getItem("username") || "Гість";
  const [completedScenariosCount, setCompletedScenariosCount] = useState(0);
  const [completedMaterialsCount, setCompletedMaterialsCount] = useState(0);
  const [username, setUsername] = useState(initialUsername);
  const [showStabilizationHint, setShowStabilizationHint] = useState(false);
  const [lastCompletedActivity, setLastCompletedActivity] = useState(null);
  const [activeQuestTask, setActiveQuestTask] = useState(null);
  const [forceSpeakMode, setForceSpeakMode] = useState(null);
  const [isMistakesAnalysisMode, setIsMistakesAnalysisMode] = useState(false);
  const [mistakesData, setMistakesData] = useState(null);

  const [prevResilience, setPrevResilience] = useState(50);
  const [consecutiveDrops, setConsecutiveDrops] = useState(0);

  useEffect(() => {
    if (resilience < prevResilience) {
      setConsecutiveDrops(prev => prev + 1);
    } else if (resilience > prevResilience) {
      setConsecutiveDrops(0);
    }
    setPrevResilience(resilience);
  }, [resilience]);

  useEffect(() => {
    
    const isNegativeMood = ['anxiety', 'stress', 'exhausted', 'anger'].includes(currentMood);
    if (resilience > 0 && resilience < 35 && isNegativeMood) {
      setShowStabilizationHint(true);
    } else {
      setShowStabilizationHint(false);
    }
  }, [resilience, currentMood]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      
      if (e.key === '1') {
        setResilience(prev => Math.max(0, prev - 10));
      }
      if (e.key === '2') {
        setResilience(prev => Math.min(100, prev + 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setUserId(localStorage.getItem("userId"));
      setUsername(localStorage.getItem("username") || "Гість");
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (location.state?.showSOS) {
      
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const isFetchingRef = useRef(false);

  const refreshStats = useCallback(() => {
    const isGuest = api.isGuest();
    const finalUserId = userId || localStorage.getItem("userId");
    
    if (finalUserId || isGuest) {
      api.getUserStats(finalUserId)
        .then((stats) => {
          setUserStats(stats);
          if (stats?.resilience?.current !== undefined) {
            setResilience(Math.round(stats.resilience.current));
          } else if (stats?.allTime?.resilience !== undefined) {
            setResilience(Math.round(stats.allTime.resilience));
          } else if (typeof stats?.resilience === 'number') {
            setResilience(Math.round(stats.resilience));
          }
          if (stats?.resilienceMultiplier !== undefined) {
            setResilienceMultiplier(stats.resilienceMultiplier);
          } else if (stats?.stats?.resilienceMultiplier !== undefined) {
            setResilienceMultiplier(stats.stats.resilienceMultiplier);
          } else {
            setResilienceMultiplier(1.0);
          }
          if (stats?.streak !== undefined) {
            setStreak(stats.streak);
          }
        })
        .catch((err) => console.error('Error loading user stats:', err));

      if (finalUserId && !isGuest) {
        api.updateStreak(finalUserId)
          .then((data) => {
            if (data && data.streak !== undefined) {
              setStreak(data.streak);
            }
          })
          .catch(() => { });
      }
    }
  }, [userId]);

  useEffect(() => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;


    const fetchData = async () => {
      try {
        
        const materials = await api.getMaterials();
        if (Array.isArray(materials)) {
          const adviceTitles = ["Гігієна сну в стресі", "Емоційний інтелект", "Медітація для новачків", "Як працює кортизол"];
            const mappedData = materials
            .filter(m => !adviceTitles.includes(m.title))
            .map(m => ({
              id: m._id,
              title: m.title,
              type: m.type === 'text' ? 'Стаття' : m.type === 'video' ? 'Відео' : 'Аудіо',
              cat: m.category || 'Загальне',
              duration: m.duration || '10 хв',
              icon: m.type === 'text' ? <FileText size={20} /> : m.type === 'video' ? <Video size={20} /> : <Headphones size={20} />,
              color: m.category === 'anxiety' ? 'bg-blue-500' : m.category === 'stress' ? 'bg-emerald-500' : m.category === 'apathy' ? 'bg-rose-500' : 'bg-purple-500',
              url: m.url,
              content: m.content,
              desc: m.desc
            }));
          setMediaLibraryData(mappedData);
        }

        
        if (userId || api.isGuest()) {
          const profile = await api.getProfile();
          if (profile) {
            if (profile.username) setUsername(profile.username);
            setCompletedScenariosCount(profile.completedScenarios?.length || 0);
            setCompletedMaterialsCount(profile.completedMaterials?.length || 0);
          }
        }

        
        const scenarios = await api.getScenarios();
        if (Array.isArray(scenarios)) {
          setSimulatorScenariosList(scenarios);
        }

        
        refreshStats();

      } catch (err) {
        console.error('❌ [DEBUG] Error in main data fetch:', err);
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchData();
    
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refreshStats();
    }
    
  }, [userId]);

  useEffect(() => {
    if (!userId || api.isGuest()) return;

    
    const socket = io(API_URL.replace('/api', ''), {
      withCredentials: true
    });

    socket.on('connect', () => {
      socket.emit('join', userId);
    });

    socket.on('resilienceUpdate', (data) => {
      if (data && data.resilience !== undefined) {
        setResilience(Math.round(data.resilience));
      }
      if (data && data.resilienceMultiplier !== undefined) {
        setResilienceMultiplier(data.resilienceMultiplier);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);





  const navigateTo = (id, materialId = null) => {
    if (materialId) {
      navigate(`/material/${materialId}`);
      return;
    }
    
    if (id === 'chat') {
      setIsChatMode(true);
      setIsSimulatorMode(false);
    } else {
      setCurrentView(id);
      if (!visitedViews.includes(id)) {
        setVisitedViews(prev => [...prev, id]);
      }
      setSearchTerm('');
      setTestStep(0);
      setIsTestFinished(false);
      setIsChatMode(false);
      setIsSimulatorMode(false);
      setIsFindDifferencesMode(false);
      setIsSortingMode(false);
    }
  };

  const applyResilienceChange = (type, metadata = {}) => {
    if (userId || api.isGuest()) {
      api.updateResilience(userId, type, metadata, metadata.name || type)
        .then((res) => {
          if (res && res.currentResilience !== undefined) {
            setResilience(Math.round(res.currentResilience));
          } else if (res && res.stats && res.stats.resilience !== undefined) {
            setResilience(Math.round(res.stats.resilience));
          }
          refreshStats();
        })
        .catch((err) => console.error("Error updating resilience:", err));
    }
    return 0; 
  };

  const handleActivityComplete = useCallback((type, id = null) => {
    const allowedTypes = ['diary', 'practice', 'diagnostic', 'chat', 'sorting', 'simulator', 'find-differences'];
    if (!allowedTypes.includes(type)) return;

    if (activeQuestTask) {
      let isMatch = false;
      if (type === 'diary' && activeQuestTask.questType === 'diary_task') {
        isMatch = true;
      } else if (type === 'practice' && activeQuestTask.questType === 'breathing_task') {
        isMatch = true;
      } else if (type === 'sorting' && activeQuestTask.questType === 'sorting') {
        isMatch = true;
      } else if ((type === 'simulator' || type === 'find-differences') && activeQuestTask.questType === 'exercise' && activeQuestTask.scenarioId === id) {
        isMatch = true;
      }

      if (isMatch) {
        if (userId || api.isGuest()) {
          api.updateResilience(userId, "quest_task", {}, activeQuestTask.title || activeQuestTask.questType)
            .then(() => refreshStats())
            .catch((err) => console.error("Error updating quest task resilience:", err));
        }
      }
    }

    setLastCompletedActivity({ type, id, timestamp: Date.now() });
    setActiveQuestTask(null);
  }, [activeQuestTask, userId, refreshStats]);

  const handleMoodSelect = (moodId) => {
    setCurrentMood(moodId);
    applyResilienceChange('mood_select', { mood: moodId });
    
    
    const message = moodId === 'anxiety' || moodId === 'stress' 
      ? "Ваш стан зафіксовано. Це вимагає додаткових зусиль для відновлення." 
      : "Чудово! Ваша стійкість зростає.";
    
  };

  const handleChatBack = () => {
    setIsChatMode(false);
    setIsSimulatorMode(false);
    setIsFindDifferencesMode(false);
    setIsSortingMode(false);
    setIsMistakesAnalysisMode(false);
    setCurrentView('home');
  };

  const handleCompanionAction = (action) => {
    setForceSpeakMode(null);
    if (action === 'testing') {
      navigateTo('testing');
    } else if (action === 'start_tour') {
      setTourStep('1_go_testing');
      localStorage.setItem('dr_tour_step', '1_go_testing');
    } else if (action === 'end_tour') {
      setTourStep('0');
      localStorage.setItem('dr_tour_step', '0');
    } else if (action === 'breathing') {
      navigateTo('practice');
    } else if (action === 'sorting') {
      const sortingScenarios = simulatorScenariosList.filter(s => s.type === "sorting");
      const randomScenario = sortingScenarios.length > 0 
          ? sortingScenarios[Math.floor(Math.random() * sortingScenarios.length)]
          : null;
      
      setSimulatorScenarioId(randomScenario?.scenarioId || randomScenario?._id || null);
      if (randomScenario) {
        setIsSortingMode(true);
      }
    } else if (action === 'sos') {
      setShowSOS(true);
    } else if (action === 'mistakes') {
      setIsChatMode(false);
      setIsMistakesAnalysisMode(true);
    }
  };

  useEffect(() => {
    localStorage.setItem('dr_tour_step', tourStep);
  }, [tourStep]);

  
  useEffect(() => {
    if (tourStep === '2_do_testing' && isTestFinished) {
      setTourStep('3_go_quests');
    } else if (tourStep === '4_do_sorting' && lastCompletedActivity?.type === 'sorting') {
      setTourStep('5_do_chat');
    } else if (tourStep === '5_do_chat' && lastCompletedActivity?.type === 'chat') {
      setTourStep('6_go_library');
    } else if (tourStep === '7_do_library' && lastCompletedActivity?.type === 'library') {
      setTourStep('8_finish');
    }
  }, [isTestFinished, lastCompletedActivity, tourStep]);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(`dr_scroll_pos_${currentView}`);
    if (savedScroll && scrollContainerRef.current) {
        setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = parseInt(savedScroll, 10);
            }
        }, 50);
        
        // Backup restore after longer delay for heavy layouts
        setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = parseInt(savedScroll, 10);
            }
        }, 300);
    }
  }, [currentView]);

  const handleScroll = (e) => {
      sessionStorage.setItem(`dr_scroll_pos_${currentView}`, e.target.scrollTop);
  };

  const isSpecialMode = isChatMode || isSimulatorMode || isFindDifferencesMode || isSortingMode || isMistakesAnalysisMode;

  
  const token = localStorage.getItem("dr_token");
  
  useEffect(() => {
    if (!token) {
      navigate('/auth', { replace: true });
    }
  }, [token, navigate]);

  if (!token) {
    return null;
  }

  return (
    <div className={`flex flex-col md:flex-row h-screen bg-[#0b0f1a] text-slate-300 font-sans overflow-hidden`}>
      {}
      {showSOS && <div className="fixed inset-0 z-[100] bg-[#0b0f1a]/80 animate-in fade-in duration-300"></div>}

      <MainSidebar 
        username={username}
        resilience={resilience}
        currentView={currentView}
        isGuest={isGuest}
        isSpecialMode={isSpecialMode}
        navigateTo={navigateTo}
        handleChatBack={handleChatBack}
        showSOS={showSOS}
        logout={() => { api.logout(); navigate('/auth'); }}
        tourStep={tourStep}
      />
      <main 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 flex flex-col overflow-y-auto bg-[#0b0f1a] transition-opacity duration-500 will-change-[opacity] ${showSOS ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}
      >
        <MainHeader 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setShowSOS={setShowSOS}
            currentView={currentView}
            logout={() => { api.logout(); navigate('/auth'); }}
            username={username}
            resilience={resilience}
        />

        <div className="flex-1 relative">
          <React.Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            {}
            {isChatMode && (
              <div className="absolute inset-0 z-10 bg-[#0b0f1a]">
                <MainChat
                  onBack={handleChatBack}
                  username={username}
                  resilience={resilience}
                  onComplete={(id) => handleActivityComplete('chat', id)}
                  onMistakesSuggested={(scenario, userPath) => {
                     setMistakesData({ scenario, path: userPath });
                     setForceSpeakMode('mistakes');
                  }}
                  onStartMistakesAnalysis={(scenario, userPath) => {
                     setMistakesData({ scenario, path: userPath });
                     setIsChatMode(false);
                     setIsMistakesAnalysisMode(true);
                  }}
                />
              </div>
            )}
            {isMistakesAnalysisMode && mistakesData && (
              <div className="absolute inset-0 z-10 bg-[#0b0f1a]">
                <MistakesAnalysis
                  data={mistakesData}
                  onBack={handleChatBack}
                />
              </div>
            )}
            {isSimulatorMode && simulatorScenarioId && (
              <div className="absolute inset-0 z-10 bg-[#0b0f1a]">
                <SimulatorPage
                  isEmbedded={true}
                  embeddedId={simulatorScenarioId}
                  onBack={() => { setIsSimulatorMode(false); refreshStats(); }}
                  applyResilienceChange={applyResilienceChange}
                  onComplete={(id) => handleActivityComplete('simulator', id)}
                />
              </div>
            )}
            {isFindDifferencesMode && (
              <div className="absolute inset-0 z-10 bg-[#0b0f1a]">
                <UpdatedFindDifferencesPage
                  isEmbedded={true}
                  embeddedId={simulatorScenarioId}
                  onBack={() => { setIsFindDifferencesMode(false); refreshStats(); }}
                  applyResilienceChange={applyResilienceChange}
                  onComplete={(id) => handleActivityComplete('find-differences', id)}
                />
              </div>
            )}
            {isSortingMode && (
              <div className="absolute inset-0 z-10 bg-[#0b0f1a]">
                <UpdatedSortingPage
                  isEmbedded={true}
                  embeddedId={simulatorScenarioId}
                  onBack={() => { setIsSortingMode(false); refreshStats(); }}
                  applyResilienceChange={applyResilienceChange}
                  onComplete={(id) => handleActivityComplete('sorting', id)}
                />
              </div>
            )}

            {}
            <div className={`relative h-full w-full ${(isChatMode || isSimulatorMode || isFindDifferencesMode || isSortingMode) ? 'hidden' : 'block'}`}>
                {visitedViews.includes('home') && (
                  <div className={`h-full w-full ${currentView === 'home' ? 'block' : 'hidden'}`}>
                    <HomeView 
                      searchTerm={searchTerm} 
                      navigateTo={navigateTo} 
                      simulatorScenariosList={simulatorScenariosList} 
                      setSimulatorScenarioId={setSimulatorScenarioId} 
                      setIsFindDifferencesMode={setIsFindDifferencesMode} 
                      setIsSortingMode={setIsSortingMode} 
                      setIsSimulatorMode={setIsSimulatorMode}
                      username={username}
                      resilience={resilience}
                      setResilience={setResilience}
                      streak={streak}
                      setStreak={setStreak}
                      currentMood={currentMood}
                      setCurrentMood={handleMoodSelect}
                      mediaLibraryData={mediaLibraryData}
                      showStabilizationHint={showStabilizationHint}
                    />
                  </div>
                )}
                {visitedViews.includes('library') && (
                  <div className={`h-full w-full ${currentView === 'library' ? 'block' : 'hidden'}`}>
                    <LibraryView
                      mediaLibraryData={mediaLibraryData}
                      libraryFilter={libraryFilter}
                      setLibraryFilter={setLibraryFilter}
                      searchTerm={searchTerm}
                      userId={userId}
                      userStats={userStats}
                      setUserStats={setUserStats}
                      tourStep={tourStep}
                      currentMood={currentMood}
                      resilience={resilience}
                    />
                  </div>
                )}
                {visitedViews.includes('quests') && (
                  <div className={`h-full w-full ${currentView === 'quests' ? 'block' : 'hidden'}`}>
                    <QuestsView
                      navigateTo={navigateTo}
                      resilience={resilience}
                      setSimulatorScenarioId={setSimulatorScenarioId}
                      setIsSimulatorMode={setIsSimulatorMode}
                      setIsFindDifferencesMode={setIsFindDifferencesMode}
                      setIsSortingMode={setIsSortingMode}
                      simulatorScenariosList={simulatorScenariosList}
                      onStartQuestTask={(quest) => setActiveQuestTask(quest)}
                      tourStep={tourStep}
                      lastCompletedActivity={lastCompletedActivity}
                    />
                  </div>
                )}
                {visitedViews.includes('testing') && (
                  <div className={`h-full w-full ${currentView === 'testing' ? 'block' : 'hidden'}`}>
                    <TestingView 
                      testStep={testStep} 
                      setTestStep={setTestStep} 
                      testAnswers={testAnswers} 
                      setTestAnswers={setTestAnswers} 
                      isTestFinished={isTestFinished} 
                      setIsTestFinished={setIsTestFinished} 
                      userId={userId} 
                      setResilience={setResilience} 
                      userStats={userStats} 
                      setUserStats={setUserStats} 
                      navigateTo={navigateTo} 
                      onFinish={() => { refreshStats(); handleActivityComplete('diagnostic'); }}
                    />
                  </div>
                )}
                {visitedViews.includes('stats') && (
                  <div className={`h-full w-full ${currentView === 'stats' ? 'block' : 'hidden'}`}>
                    <StatsView
                      userId={userId}
                      userStats={userStats}
                      resilience={resilience}
                      resilienceMultiplier={resilienceMultiplier}
                      completedCount={completedScenariosCount + completedMaterialsCount}
                      isVisible={currentView === 'stats'}
                      onRefresh={refreshStats}
                    />
                  </div>
                )}
                {visitedViews.includes('practice') && (
                  <div className={`h-full w-full ${currentView === 'practice' ? 'block' : 'hidden'}`}>
                    <PracticeView 
                      userId={userId} 
                      navigateTo={navigateTo} 
                      onFinish={() => { refreshStats(); handleActivityComplete('practice'); }}
                    />
                  </div>
                )}
                {visitedViews.includes('advice') && (
                  <div className={`h-full w-full ${currentView === 'advice' ? 'block' : 'hidden'}`}>
                    <AdviceView />
                  </div>
                )}
                {visitedViews.includes('diary') && (
                  <div className={`h-full w-full ${currentView === 'diary' ? 'block' : 'hidden'}`}>
                    <DiaryView userId={userId} onAddEntry={() => handleActivityComplete('diary')} />
                  </div>
                )}
            </div>
          </React.Suspense>
        </div>
        <footer className="h-16 px-8 flex items-center justify-between border-t border-slate-900/50 text-[10px] text-slate-600 font-bold uppercase tracking-widest bg-[#0b0f1a]">
          <div className="flex gap-6">
            <span className="hover:text-slate-400 cursor-pointer transition-colors" onClick={() => setShowSOS(true)}>SOS Допомога</span>
            <span className="hidden md:inline opacity-30">|</span>
            <span className="hidden md:inline">Система Shelter не є заміною професійної терапії</span>
          </div>
          <div>© 2026 Shelter App</div>
        </footer>
      </main>

      <CharacterCompanion 
        resilience={resilience}
        completedCount={completedScenariosCount + completedMaterialsCount}
        isSpecialModeActive={isSpecialMode || isMistakesAnalysisMode || isChatMode}
        isTestFinished={isTestFinished}
        currentView={currentView}
        onAction={handleCompanionAction}
        lastCompletedActivity={lastCompletedActivity}
        consecutiveDrops={consecutiveDrops}
        forceSpeakMode={forceSpeakMode}
        tourStep={tourStep}
      />

      {tourStep !== '0' && (
        <div className="fixed inset-0 z-[9900] bg-[#0b0f1a]/80  pointer-events-auto transition-all duration-500" />
      )}

      {showSOS && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 " onClick={() => { setShowSOS(false); setTimeout(() => setShowSOSPhones(false), 300); }}></div>
          <div className="relative bg-[#0f1423] p-8 sm:p-10 rounded-[36px] w-full max-w-lg shadow-[0_0_80px_rgba(16,185,129,0.15)] text-left animate-in zoom-in-95 duration-300">
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-16 h-16 bg-emerald-500/15 rounded-[20px] flex items-center justify-center">
                <AlertCircle size={32} className="text-emerald-500" />
              </div>
              <button onClick={() => { setShowSOS(false); setTimeout(() => setShowSOSPhones(false), 300); }} className="text-slate-500 hover:text-white transition-colors p-2 -mr-2 -mt-2">
                <X size={28} />
              </button>
            </div>

            {!showSOSPhones ? (
                <>
                    <h2 className="text-3xl sm:text-[32px] font-black text-white uppercase mb-4 tracking-tight">Екстрена допомога</h2>
                    <p className="text-slate-400 mb-10 text-[17px] leading-relaxed font-medium">
                        Зараз ми проведемо коротку практику «Квадратне дихання». Це допоможе вашій нервовій системі повернутися до стану спокою.
                    </p>
                    
                    <div className="flex flex-col gap-4">
                    <button 
                        onClick={() => { setShowSOS(false); setTimeout(() => setShowSOSPhones(false), 300); navigateTo('practice'); }} 
                        className="w-full bg-white text-black py-5 rounded-[20px] font-bold text-[17px] hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
                    >
                        <Wind size={22} />
                        Почати дихання (4-4-4)
                    </button>
                    <button 
                        onClick={() => setShowSOSPhones(true)}
                        className="w-full bg-[#1b2336] text-white py-5 rounded-[20px] font-bold text-[17px] hover:bg-[#252f48] transition-all"
                    >
                        Зв'язатися з фахівцем
                    </button>
                    </div>
                </>
            ) : (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-3 mb-4 -mt-4">
                        <button onClick={() => setShowSOSPhones(false)} className="text-slate-500 hover:text-white transition-colors -ml-2 p-2">
                            <ChevronLeft size={28} />
                        </button>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Гарячі лінії</h2>
                    </div>
                    <p className="text-slate-400 mb-8 text-[15px] leading-relaxed font-medium">
                        Ці служби працюють безкоштовно та анонімно. Оберіть потрібну лінію:
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <a href="tel:7333" className="w-full bg-[#1b2336] border border-slate-800 text-white p-5 rounded-[20px] hover:bg-[#252f48] transition-all flex justify-between items-center group">
                            <div>
                                <p className="font-bold text-[17px] mb-1">Lifeline Ukraine</p>
                                <p className="text-slate-400 text-sm">Психологічна підтримка</p>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-500 font-black px-4 py-2 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">7333</span>
                        </a>
                        <a href="tel:1558" className="w-full bg-[#1b2336] border border-slate-800 text-white p-5 rounded-[20px] hover:bg-[#252f48] transition-all flex justify-between items-center group">
                            <div>
                                <p className="font-bold text-[17px] mb-1">Лінія підтримки</p>
                                <p className="text-slate-400 text-sm">Ветеран Хаб</p>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-500 font-black px-4 py-2 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">1558</span>
                        </a>
                        <a href="tel:0800501701" className="w-full bg-[#1b2336] border border-slate-800 text-white p-5 rounded-[20px] hover:bg-[#252f48] transition-all flex justify-between items-center group">
                            <div>
                                <p className="font-bold text-[17px] mb-1">Телефон довіри</p>
                                <p className="text-slate-400 text-sm">Всеукраїнська лінія</p>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-500 font-black px-4 py-2 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">0 800 501 701</span>
                        </a>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShelterAppComplete;
