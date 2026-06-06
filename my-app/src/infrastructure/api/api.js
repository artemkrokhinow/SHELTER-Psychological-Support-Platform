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

export const api = {
	isGuest,

	getProfile: () => {
		if (isGuest()) {
			return fetch(`${API_URL}/auth/guest/me`, {
				credentials: "include",
			}).then((res) => res.json());
		}
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
	loginAsGuest: () =>
		fetch(`${API_URL}/auth/guest`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		}).then((res) => res.json()),

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

	migrateGuest: (data) =>
		fetch(`${API_URL}/auth/migrate-guest`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		}).then((res) => res.json()),

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
		if (isGuest()) {
			return fetch(`${API_URL}/auth/guest/update-resilience`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ type: 'breathing', metadata: { minutes }, name: `Дихальна сесія (${minutes} хв)` })
			}).then((res) => res.json());
		}
		return fetch(`${API_URL}/stats/breathing/${userId}`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ minutes })
		}).then((res) => res.json());
	},

	recordDiagnostic: (userId, answers) => {
		if (isGuest()) {
			return fetch(`${API_URL}/auth/guest/diagnostic`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ answers })
			}).then((res) => res.json());
		}
		return fetch(`${API_URL}/stats/diagnostic/${userId}`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ answers })
		}).then((res) => res.json());
	},

	recordMaterialView: (userId, materialId, minutes = 0) => {
		if (isGuest()) {
			
			
			return fetch(`${API_URL}/auth/guest/update-resilience`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ type: 'material_view', itemId: materialId, metadata: { minutes }, name: `Перегляд матеріалу` })
			}).then((res) => res.json());
		}
		return fetch(`${API_URL}/stats/material-view/${userId}`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ materialId, minutes })
		}).then((res) => res.json());
	},

	updateStreak: (userId) => {
		if (isGuest()) {
			return Promise.resolve({ success: true, guest: true });
		}
		return fetch(`${API_URL}/auth/activity`, {
			method: 'POST',
			headers: getHeaders(),
			credentials: 'include'
		}).then((res) => res.json());
	},

	updateUserProgress: (userId, itemId, type) => {
		if (isGuest()) {
			return fetch(`${API_URL}/auth/guest/update-resilience`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					type: `complete_${type}`,
					metadata: {},
					name: `Завершено: ${type === 'material' ? 'Матеріал' : 'Вправу'}`,
					itemId
				}),
			}).then((res) => res.ok ? res.json() : res.text().then(t => { throw new Error(t) }));
		}
		if (!isValidId(userId)) return Promise.reject("Invalid ID");
		return fetch(`${API_URL}/users/update-progress`, {
			method: "POST",
			headers: getHeaders(),
			body: JSON.stringify({ userId, itemId, type }),
		}).then((res) => res.ok ? res.json() : res.text().then(t => { throw new Error(t) }));
	},

	getUserStats: (userId) => {
		if (isGuest()) {
			return fetch(`${API_URL}/auth/guest/stats-volume`, {
				credentials: "include",
			}).then((res) => res.json());
		}
		const finalUserId = userId || localStorage.getItem("userId");
		if (!isValidId(finalUserId)) return Promise.reject("Invalid ID");
		return fetch(`${API_URL}/stats/user/${finalUserId}`, {
			headers: getHeaders(),
		}).then((res) => res.json());
	},

	addDiaryEntry: (userId, mood, content, tags = []) => {
		if (isGuest()) {
			return fetch(`${API_URL}/auth/guest/diary`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ mood, content, tags })
			}).then((res) => res.json());
		}
		return fetch(`${API_URL}/stats/diary/${userId}`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ mood, content, tags })
		}).then((res) => res.json());
	},

	getDiaryEntries: (userId, limit = 10, page = 1) => {
		if (isGuest()) {
			return fetch(`${API_URL}/auth/guest/diary`, {
				credentials: 'include'
			}).then((res) => res.json());
		}
		return fetch(`${API_URL}/stats/diary/${userId}?limit=${limit}&page=${page}`, {
			headers: getHeaders()
		}).then((res) => res.json());
	},

	updateResilience: (userId, type, metadata = {}, name) => {
		if (isGuest()) {
			return fetch(`${API_URL}/auth/guest/update-resilience`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ type, metadata, name }),
			}).then((res) => res.json()).then(data => {
				return data;
			});
		}
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
		if (isGuest()) {
			return fetch(`${API_URL}/auth/guest/stats-volume`, {
				credentials: "include",
			}).then((res) => res.json());
		}
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
			})
			.then((data) => {
				return data;
			});
	},

	deleteDiaryEntry: (userId, entryId) => {
		if (isGuest()) return Promise.resolve({ success: true });
		return fetch(`${API_URL}/stats/diary/${userId}/${entryId}`, {
			method: 'DELETE',
			headers: getHeaders()
		}).then((res) => res.json());
	},

	deletePersonalData: (userId) => {
		if (isGuest()) {
			document.cookie = "dr_guest=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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
