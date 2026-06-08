const getBaseUrl = () => {
	const host = window.location.hostname;
	const port = 5000;
	if (host === "localhost" || host === "127.0.0.1") {
		return `http://${host}:${port}/api`;
	}
	return "https://shelter-jsv0.onrender.com/api";
};

export const API_URL = getBaseUrl();

const getHeaders = () => ({
	"Content-Type": "application/json",
	"x-auth-token": localStorage.getItem("dr_token"),
});

const isValidId = (id) => id && id !== "null" && id !== "undefined";

const isGuest = () => localStorage.getItem("dr_token") === "guest_mode";

// ==========================================
// GUEST LOCAL STORAGE SERVICE
// ==========================================
const GUEST_KEY = 'shelter_guest_data';

const getGuestData = () => {
	const data = localStorage.getItem(GUEST_KEY);
	if (!data) return null;
	return JSON.parse(data);
};

const saveGuestData = (data) => {
	localStorage.setItem(GUEST_KEY, JSON.stringify(data));
};

const guestService = {
	init: () => {
		let data = getGuestData();
		if (!data) {
			data = {
				id: "guest_" + Math.random().toString(36).substr(2, 9),
				username: "Гість",
				isGuest: true,
				diagnostic: { answers: [], completedAt: null },
				stats: { resilience: 50, stabilityDays: 0 },
				history: [],
				completedScenarios: [],
				diaryEntries: []
			};
			saveGuestData(data);
		}
		localStorage.setItem("dr_token", "guest_mode");
		localStorage.setItem("userId", data.id);
		localStorage.setItem("username", data.username);
		return Promise.resolve({ id: data.id, username: data.username, isGuest: true });
	},
	getProfile: () => {
		const data = getGuestData();
		return Promise.resolve({ user: { id: data.id, username: data.username, isGuest: true } });
	},
	getStatsVolume: () => {
		const data = getGuestData();
		return Promise.resolve({
			stats: data.stats,
			diagnostic: data.diagnostic,
            completedScenarios: data.completedScenarios
		});
	},
	updateResilience: (type, metadata = {}, name) => {
		const data = getGuestData();
		let change = 0;
		if (type === 'breathing') change = +3;
		if (type === 'material_view') change = +2;
		if (type === 'mood_select') {
			const mood = metadata.mood;
			if (['anxiety', 'stress', 'exhausted', 'anger'].includes(mood)) change = -3;
			if (['calm', 'happy', 'energetic', 'confident'].includes(mood)) change = +2;
		}
		if (type.startsWith('complete_')) change = +4;

		data.stats.resilience = Math.max(0, Math.min(100, data.stats.resilience + change));
		
		const historyEntry = {
			type,
			change,
			resilienceAfter: data.stats.resilience,
			metadata,
			name,
			timestamp: new Date().toISOString()
		};
		data.history.push(historyEntry);
		saveGuestData(data);
		
		return Promise.resolve({ success: true, stats: data.stats, historyEntry, change });
	},
	recordDiagnostic: (answers) => {
		const data = getGuestData();
		data.diagnostic = { answers, completedAt: new Date().toISOString() };
		data.stats.resilience = Math.min(100, data.stats.resilience + 5);
		saveGuestData(data);
		return Promise.resolve({ success: true });
	},
	completeScenario: (scenarioId, score) => {
		const data = getGuestData();
		if (!data.completedScenarios.includes(scenarioId)) {
			data.completedScenarios.push(scenarioId);
		}
		saveGuestData(data);
		return guestService.updateResilience('complete_scenario', { score }, 'Завершено квест');
	},
	addDiaryEntry: (mood, content, tags) => {
		const data = getGuestData();
		const newEntry = {
			_id: "entry_" + Math.random().toString(36).substr(2, 9),
			mood,
			content,
			tags,
			createdAt: new Date().toISOString()
		};
		data.diaryEntries.unshift(newEntry);
		saveGuestData(data);
		return Promise.resolve(newEntry);
	},
	getDiaryEntries: () => {
		const data = getGuestData();
		return Promise.resolve(data.diaryEntries);
	},
	deleteDiaryEntry: (entryId) => {
		const data = getGuestData();
		data.diaryEntries = data.diaryEntries.filter(e => e._id !== entryId);
		saveGuestData(data);
		return Promise.resolve({ success: true });
	}
};
// ==========================================


export const api = {
	isGuest,

	getProfile: () => {
		if (isGuest()) return guestService.getProfile();
		const userId = localStorage.getItem("userId");
		if (!isValidId(userId)) return Promise.reject("Invalid ID");
		return fetch(`${API_URL}/users/${userId}/profile`, {
			headers: getHeaders(),
		}).then((res) => res.json());
	},

	logout: () => {
		localStorage.removeItem("dr_token");
		localStorage.removeItem("userId");
		localStorage.removeItem("username");
		return Promise.resolve();
	},
	
	loginAsGuest: () => guestService.init(),

	login: (data) =>
		fetch(`${API_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		}).then((res) => res.json()),

	googleLogin: (idToken) =>
		fetch(`${API_URL}/auth/google`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ idToken }),
		}).then((res) => res.json()),

	register: (data) =>
		fetch(`${API_URL}/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		}).then((res) => res.json()),

	migrateGuest: (data) => {
        // Додаємо локальні дані гостя до запиту міграції
        const guestData = getGuestData();
		return fetch(`${API_URL}/auth/migrate-guest`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ ...data, guestData }),
		}).then((res) => {
            if (res.ok) {
                // Після успішної міграції очищаємо локального гостя
                localStorage.removeItem(GUEST_KEY);
            }
            return res.json();
        });
    },

	getMaterials: () => fetch(`${API_URL}/materials`).then((res) => res.json()),

	createMaterial: (data) =>
		fetch(`${API_URL}/materials`, {
			method: "POST",
			headers: getHeaders(),
			body: JSON.stringify(data),
		}).then((res) => res.json()),

	updateMaterial: (id, data) =>
		fetch(`${API_URL}/materials/${id}`, {
			method: "PUT",
			headers: getHeaders(),
			body: JSON.stringify(data),
		}).then((res) => res.json()),

	deleteMaterial: (id) =>
		fetch(`${API_URL}/materials/${id}`, {
			method: "DELETE",
			headers: getHeaders(),
		}).then((res) => res.json()),

	getScenarios: () => fetch(`${API_URL}/scenarios`).then((res) => res.json()),

	getAdvice: () => fetch(`${API_URL}/advice`).then((res) => res.json()),
	getRandomAdvice: () => fetch(`${API_URL}/advice/random`).then((res) => res.json()),

	getDiagnosticQuestions: (category) => {
		const url = category ? `${API_URL}/diagnostic/questions?category=${category}` : `${API_URL}/diagnostic/questions`;
		return fetch(url).then((res) => res.json());
	},

	seedDiagnostics: () => fetch(`${API_URL}/diagnostic/seed`, { method: "POST" }).then((res) => res.json()),

	createScenario: (data) =>
		fetch(`${API_URL}/scenarios`, {
			method: "POST",
			headers: getHeaders(),
			body: JSON.stringify(data),
		}).then((res) => res.json()),

	updateScenario: (id, data) =>
		fetch(`${API_URL}/scenarios/${id}`, {
			method: "PUT",
			headers: getHeaders(),
			body: JSON.stringify(data),
		}).then((res) => res.json()),

	deleteScenario: (id) =>
		fetch(`${API_URL}/scenarios/${id}`, {
			method: "DELETE",
			headers: getHeaders(),
		}).then((res) => res.json()),

	getScenarioById: (id) =>
		fetch(`${API_URL}/scenarios/${id}`).then((res) => res.json()),

	getMaterialById: (id) =>
		fetch(`${API_URL}/materials/${id}`).then((res) => res.json()),

	getDashboardStats: (userId) =>
		fetch(`${API_URL}/stats/dashboard/${userId}`).then((res) => res.json()),

	recordBreathingSession: (userId, minutes) => {
		if (isGuest()) return guestService.updateResilience('breathing', { minutes }, `Дихальна сесія (${minutes} хв)`);
		return fetch(`${API_URL}/stats/breathing/${userId}`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ minutes })
		}).then((res) => res.json());
	},

	recordDiagnostic: (userId, answers) => {
		if (isGuest()) return guestService.recordDiagnostic(answers);
		return fetch(`${API_URL}/stats/diagnostic/${userId}`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ answers })
		}).then((res) => res.json());
	},

	recordMaterialView: (userId, materialId, minutes = 0) => {
		if (isGuest()) return guestService.updateResilience('material_view', { minutes }, `Перегляд матеріалу`);
		return fetch(`${API_URL}/stats/material-view/${userId}`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ materialId, minutes })
		}).then((res) => res.json());
	},

	updateStreak: (userId) => {
		if (isGuest()) return Promise.resolve({ success: true, guest: true });
		return fetch(`${API_URL}/auth/activity`, {
			method: 'POST',
			headers: getHeaders(),
			credentials: 'include'
		}).then((res) => res.json());
	},

	updateUserProgress: (userId, itemId, type) => {
		if (isGuest()) return guestService.updateResilience(`complete_${type}`, {}, `Завершено: ${type === 'material' ? 'Матеріал' : 'Вправу'}`);
		if (!isValidId(userId)) return Promise.reject("Invalid ID");
		return fetch(`${API_URL}/users/update-progress`, {
			method: "POST",
			headers: getHeaders(),
			body: JSON.stringify({ userId, itemId, type }),
		}).then((res) => res.ok ? res.json() : res.text().then(t => { throw new Error(t) }));
	},

	getUserStats: (userId) => {
		if (isGuest()) return guestService.getStatsVolume();
		const finalUserId = userId || localStorage.getItem("userId");
		if (!isValidId(finalUserId)) return Promise.reject("Invalid ID");
		return fetch(`${API_URL}/stats/user/${finalUserId}`, {
			headers: getHeaders(),
		}).then((res) => res.json());
	},

	addDiaryEntry: (userId, mood, content, tags = []) => {
		if (isGuest()) return guestService.addDiaryEntry(mood, content, tags);
		return fetch(`${API_URL}/stats/diary/${userId}`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ mood, content, tags })
		}).then((res) => res.json());
	},

	getDiaryEntries: (userId, limit = 10, page = 1) => {
		if (isGuest()) return guestService.getDiaryEntries();
		return fetch(`${API_URL}/stats/diary/${userId}?limit=${limit}&page=${page}`, {
			headers: getHeaders()
		}).then((res) => res.json());
	},

	updateResilience: (userId, type, metadata = {}, name) => {
		if (isGuest()) return guestService.updateResilience(type, metadata, name);
		if (!isValidId(userId)) return Promise.reject("Invalid ID");
		return fetch(`${API_URL}/stats/resilience/${userId}`, {
			method: "POST",
			headers: getHeaders(),
			body: JSON.stringify({ type, metadata, name }),
		}).then((res) => res.json()).then(data => {
			return data;
		});
	},

	getVolumeStats: (userId) => {
		if (isGuest()) return guestService.getStatsVolume();
		if (!isValidId(userId)) return Promise.reject("Invalid ID");
		return fetch(`${API_URL}/users/${userId}/stats-volume`, {
			headers: getHeaders(),
		}).then((res) => res.json());
	},

	recordActivity: () => {
		return fetch(`${API_URL}/auth/activity`, {
			method: "POST",
			headers: getHeaders(),
			credentials: "include",
		}).then((res) => res.json());
	},

	completeScenario: (scenarioId, score) => {
		if (isGuest()) return guestService.completeScenario(scenarioId, score);
		return fetch(`${API_URL}/auth/complete-scenario`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-auth-token": localStorage.getItem("dr_token"),
			},
			credentials: "include",
			body: JSON.stringify({ scenarioId, score }),
		})
			.then(async (res) => {
				if (!res.ok) {
					const errorText = await res.text();
					console.error(`❌ FRONTEND (api.js): completeScenario request failed with status ${res.status}.`, errorText);
					return { error: errorText };
				}
				return res.json();
			});
	},

	deleteDiaryEntry: (userId, entryId) => {
		if (isGuest()) return guestService.deleteDiaryEntry(entryId);
		return fetch(`${API_URL}/stats/diary/${userId}/${entryId}`, {
			method: 'DELETE',
			headers: getHeaders()
		}).then((res) => res.json());
	},

	deletePersonalData: (userId) => {
		if (isGuest()) {
			localStorage.removeItem(GUEST_KEY);
			localStorage.removeItem("dr_token");
			localStorage.removeItem("userId");
			localStorage.removeItem("username");
			return Promise.resolve({ success: true, message: "Guest session cleared" });
		}
		return fetch(`${API_URL}/stats/personal-data/${userId}`, {
			method: 'DELETE',
			headers: getHeaders()
		}).then((res) => res.json());
	},
};

export default api;
