import { useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import "./characterCompanion.css";

import { ReactComponent as HappyImg } from "../../infrastructure/assets/images/characterCompanion/happy_v2.svg";
import { ReactComponent as NormalImg } from "../../infrastructure/assets/images/characterCompanion/normal_v2.svg";
import { ReactComponent as SadImg } from "../../infrastructure/assets/images/characterCompanion/sad_v2.svg";

const characterImages = {
	happy: HappyImg,
	normal: NormalImg,
	sad: SadImg
};

const characterPhrases = {
	normal: [
		"Опа! Дивись, як я вмію розслаблятися. Головне — знайти уявне гаряче джерело!",
		"Тиць! Ой, вибач, я просто жував травинку і випадково тицьнув носом в екран.",
		"А ти знав, що я завжди тут, щоб тебе підтримати?",
		"Хвилинка статистики: я можу не рухатися три години. Ефектно, правда?",
		"Якби я був справжнім, я б обов'язково подрімав поруч із тобою.",
		"Сьогодні така гарна погода... Хоча я застряг у твоєму екрані!",
		"Як гадаєш, мені більше личить мандаринка на голові чи квіточка?",
		"Я щойно намагався порахувати всі травинки на твоєму робочому столі. Збився на одинадцятій.",
		"Знаєш, бути цифровим помічником зручно — я завжди можу бути поруч із тобою",
		"Ого, який у тебе курсор швидкий! Я краще просто посиджу тут і подивлюся."
	],
	sad: [
		"Пам'ятай: навіть найменший крок сьогодні — це вже величезний рух уперед. Я розумію, як буває важко.",
		"Ти сьогодні молодець вже тому, що просто знайшов сили зайти сюди. Я з тобою.",
		"Просто видихни. Весь цей величезний світ може зачекати одну хвилину.",
		"Я вірю в тебе навіть тоді, коли ти сам у собі сумніваєшся.",
		"Твоя стійкість — це твоя суперсила. Навіть коли здається, що сил немає.",
		"Ти не один у цьому штормі. Я поруч, і ми разом спокійно перечекаємо його.",
		"Дозволь собі сумувати чи помилятися. Це просто частина твого шляху.",
		"Ти робиш неймовірну роботу щодня. Зупинись на хвилинку і видихни.",
		"Кожна хмара має світлий край. Ми обов'язково його знайдемо!",
		"Твоя енергія дуже цінна. Не витрачай її на те, що зараз поза твоїм контролем."
	],
	happy: [
		"Вау! Ти просто неймовірний! Я аж підстрибнув! 🎉",
		"Я знав, що ти впораєшся! Ти справжній майстер! 🌟",
		"Це була фантастична робота! 100 балів тобі! ⭐",
		"Неймовірно! Ти переміг! Я пишаюся тобою! 🏆",
		"Ти зробив це! Тепер можна спокійно йти відпочивати! 🎊",
		"Я так радий за тебе! Ти справжній молодець! 🌟",
		"Ти просто геній! Навіть я б так не зміг! 🎯",
		"Браво! Твоя наполегливість принесла результат! 🏅",
		"Ти все розв'язав! Це справжнє мистецтво спокою! 🎨",
		"Вітаю! Ти пройшов завдання на відмінно! 🎪"
	]
};


const phrases = {
	calm: characterPhrases.normal,
	anxiety: characterPhrases.sad,
	stress: characterPhrases.sad,
	apathy: characterPhrases.sad,
	test: [
		"Ти робиш чудово! Продовжуй! 🌟",
		"Кожна відповідь наближає тебе до мети! 💪",
		"Вір у себе, ти на правильному шляху! ✨",
	],
	'main-hints': [
		"💡 Спробуй вправи в тренажері — це розслабить",
		"📚 Порада: переглянь освітній контент про стрес",
		"🎯 Натисни SOS якщо потрібна швидка допомога",
		"🧘 Дихальні вправи допоможуть заспокоїтися",
	],
	exercise: [
		"Ти герой! Відпрацьовуй навички! 🦸",
		"Практика робить майстром! Продовжуй! 💪",
	],
	content: [
		"Чудово, що ти навчаєшся! 📚",
		"Знання — це сила! Продовжуй! 💡",
	],
	default: [
		"Привіт! Я тут, щоб підтримати тебе! 👋",
		"Сьогодні чудовий день для прогресу! ☀️",
	],
};






const CharacterCompanion = forwardRef(({ 
	context = "default", 
	position = "bottom-right",
	resilience = 50,
	stressCount = 0,
	pageType = 'default',
	auraColor = 'emerald', 
	isBreathing = false,
	forceSpeakMode = null,
	onAction,
	completedCount = 0,
	isSpecialModeActive = false,
	isTestFinished = false,
	currentView = 'home',
	lastCompletedActivity = null,
	consecutiveDrops = 0,
	tourStep = '0'
}, ref) => {
	
	useImperativeHandle(ref, () => ({
		speakAchievement: () => {
			setIsVisible(true);
			speak('achievement');
		}
	}));
	const { t } = useTranslation();
	const [isVisible, setIsVisible] = useState(false);
	const [currentPhrase, setCurrentPhrase] = useState("");
	const [currentEmotion, setCurrentEmotion] = useState('normal');
	const [isSpeaking, setIsSpeaking] = useState(false);
	const isSpeakingRef = useRef(false);
	const speakTimeoutRef = useRef(null);
	const prevProps = useRef({
		lastCompletedActivity: null,
		isTestFinished: false,
		isSpecialModeActive: false
	});

	const getPhraseAndEmotion = useCallback((phraseType = 'normal') => {
		let emotion = 'normal';
		let arr = phrases.default || characterPhrases.normal;

		if (phraseType === 'achievement') {
			emotion = 'happy';
			arr = characterPhrases.happy;
		} else if (phraseType === 'test' || phraseType === 'exercise' || phraseType === 'content') {
			emotion = 'happy';
			arr = phrases[phraseType];
		} else if (phraseType === 'main-hints') {
			emotion = 'normal';
			arr = [
				t('companion.hint_simulator', "💡 Спробуй вправи в тренажері — це розслабить"),
				t('companion.hint_library', "📚 Порада: переглянь освітній контент про стрес"),
				t('companion.hint_sos', "🎯 Натисни SOS якщо потрібна швидка допомога"),
				t('companion.hint_breathing', "🧘 Дихальні вправи допоможуть заспокоїтися")
			];
		} else if (['anxiety', 'stress', 'apathy'].includes(phraseType)) {
			emotion = 'sad';
			arr = characterPhrases.sad;
		} else if (phraseType === 'default') {
			const randomEmotions = ['normal', 'happy', 'sad'];
			emotion = randomEmotions[Math.floor(Math.random() * randomEmotions.length)];
			arr = characterPhrases[emotion];
		} else if (phraseType === '1_diagnostics' || phraseType.includes('tour')) {
			emotion = 'normal';
		}
		
		return {
			phrase: arr[Math.floor(Math.random() * arr.length)],
			emotion
		};
	}, []);

	const speak = useCallback((phraseType = 'normal', specificPhrase = null) => {
		if (isSpeakingRef.current && !specificPhrase) return;
		
		isSpeakingRef.current = true;
		setIsSpeaking(true);
		
		if (specificPhrase) {
			setCurrentPhrase(specificPhrase);
			setCurrentEmotion('normal'); // default to normal for tour phrases unless specified otherwise
		} else {
			const result = getPhraseAndEmotion(phraseType);
			setCurrentPhrase(result.phrase);
			setCurrentEmotion(result.emotion);
		}
		
		if (speakTimeoutRef.current) {
			clearTimeout(speakTimeoutRef.current);
		}
		
		speakTimeoutRef.current = setTimeout(() => {
			isSpeakingRef.current = false;
			setIsSpeaking(false);
			setIsVisible(false);
		}, 10000);
	}, [getPhraseAndEmotion]);

	
	useEffect(() => {
		if (forceSpeakMode) {
			setIsVisible(true);
			speak(forceSpeakMode);
		}
	}, [forceSpeakMode, speak]);

	useEffect(() => {
		if (!tourStep || tourStep === '0') return;
		let text = "";
		if (tourStep === '1_diagnostics') {
			text = "Привіт! 👋 Я тут, щоб провести для тебе невеличку екскурсію. Почнемо з Діагностики! Натисни на неї зліва.";
		} else if (tourStep === '3_quests') {
			text = "Чудово! Ти знаєш свій рівень. Тепер давай перейдемо до Квестів, де ти знайдеш вправи. Тисни на Квести!";
		} else if (tourStep === '4_do_chaos') {
			text = "Спробуй міні-гру 'Сортування Хаосу'. Вона чудово розвантажує голову!";
		} else if (tourStep === '5_do_chat') {
			text = "Гарна робота! Тепер спробуй Чат-тренажер. Він навчить тебе вирішувати складні ситуації.";
		} else if (tourStep === '6_library') {
			text = "Молодець! Останній розділ — Медіатека. Переходь туди, щоб знайти корисні матеріали.";
		} else if (tourStep === '7_do_library') {
			text = "Вибери будь-який матеріал і відкрий його. Це завершить наш туторіал!";
		} else if (tourStep === '8_finish') {
			text = "Вітаю! Ти пройшов навчання і тепер готовий користуватися всіма інструментами. Успіхів! 🌟";
		}
		if (text) {
			setIsVisible(true);
			speak('tour', text);
			if (tourStep === '8_finish') setCurrentEmotion('happy');
		}
	}, [tourStep, speak]);

	
	useEffect(() => {
		if (tourStep && tourStep !== '0') return;
		if (isSpecialModeActive) {
			setIsVisible(false);
			setIsSpeaking(false);
			isSpeakingRef.current = false;
			if (speakTimeoutRef.current) {
				clearTimeout(speakTimeoutRef.current);
			}
			
			prevProps.current.isSpecialModeActive = isSpecialModeActive;
			return;
		}

		const prev = prevProps.current;
		const now = Date.now();
		const lastSpeak = Number(localStorage.getItem("lastCompanionSpeakTime") || 0);
		const cooldownSatisfied = (now - lastSpeak) > 90000;

		let shouldSpeak = false;
		let phraseCategory = 'normal';

		if (lastCompletedActivity && lastCompletedActivity?.timestamp !== prev.lastCompletedActivity?.timestamp) {
			shouldSpeak = true;
			phraseCategory = 'achievement';
		} else if (!prev.isTestFinished && isTestFinished) {
			shouldSpeak = true;
			phraseCategory = 'achievement';
		} else if (consecutiveDrops >= 2 || resilience < 30) {
			shouldSpeak = true;
			phraseCategory = 'stress';
		}

		if (shouldSpeak && cooldownSatisfied) {
			setIsVisible(true);
			speak(phraseCategory);
			localStorage.setItem("lastCompanionSpeakTime", String(now));
		}

		prevProps.current = {
			lastCompletedActivity,
			isTestFinished,
			isSpecialModeActive
		};
	}, [lastCompletedActivity, isTestFinished, isSpecialModeActive, consecutiveDrops, resilience, speak]);

	useEffect(() => {
		if (tourStep && tourStep !== '0') return;
		if (isSpecialModeActive) return;

		const hintInterval = setInterval(() => {
			const now = Date.now();
			const lastSpeak = Number(localStorage.getItem("lastCompanionSpeakTime") || 0);
			// 60 seconds cooldown for random hints
			if (now - lastSpeak > 60000) {
				// 30% chance to appear every 10 seconds if cooldown is met
				if (Math.random() < 0.3) {
					setIsVisible(true);
					speak('main-hints');
					localStorage.setItem("lastCompanionSpeakTime", String(now));
				}
			}
		}, 10000);

		return () => clearInterval(hintInterval);
	}, [tourStep, isSpecialModeActive, speak]);

	// Remove the random face cycling interval
	// (It used to just change currentCharacter randomly every 8s)
	useEffect(() => {
		return () => {
			if (speakTimeoutRef.current) {
				clearTimeout(speakTimeoutRef.current);
			}
		};
	}, []);

	if (!isVisible || isSpecialModeActive) return null;

	return (
		<div className={`character-companion ${position} ${isSpeaking ? 'speaking' : ''} ${isBreathing ? 'breathing-sync' : ''}`}>
			<div className="character-bubble">
				<p className="character-text">{currentPhrase}</p>
				
				{}
				{(resilience < 35 || forceSpeakMode === 'main-hints') && tourStep === '0' && (
					<div className="character-quick-actions">
						<button onClick={() => onAction && onAction('breathing')} className="qa-btn">🫁 Дихання</button>
						<button onClick={() => onAction && onAction('sorting')} className="qa-btn">🧩 Сортування</button>
						<button onClick={() => onAction && onAction('sos')} className="qa-btn sos">🆘 SOS</button>
					</div>
				)}
				{tourStep !== '0' && (
					<div className="mt-4 flex justify-end">
						<button onClick={() => onAction && onAction('skip_tour')} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg">Пропустити навчання</button>
					</div>
				)}
			</div>
			<div className={`character-avatar aura-${auraColor}`}>
				{(() => {
					const CurrentImg = characterImages[currentEmotion] || characterImages.normal;
					return <CurrentImg className="character-image" />;
				})()}
			</div>
		</div>
	);
});

export default CharacterCompanion;


export function useCharacterTrigger() {
	const [trigger, setTrigger] = useState(0);
	
	const triggerCharacter = useCallback(() => {
		setTrigger(prev => prev + 1);
	}, []);

	return { trigger, triggerCharacter };
}
