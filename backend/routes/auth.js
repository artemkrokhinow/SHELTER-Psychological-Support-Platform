import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Account from "../models/Account.js";
import Scenario from "../models/Scenario.js";
import { OAuth2Client } from "google-auth-library";
import mongoose from "mongoose";
import { calculateResilienceChange } from "../utils/resilienceLogic.js";

const { genSalt, hash, compare } = bcrypt;
const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendTokenResponse = (user, statusCode, res) => {
	const token = jwt.sign(
		{ id: user._id },
		process.env.JWT_SECRET || "secret_key",
		{
			expiresIn: "7d",
		},
	);

	res
		.status(statusCode)
		.cookie("dr_token", token, {
			httpOnly: true,
			expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
		})
		.json({
			token,
			user: { id: user._id, username: user.username },
		});
};

router.post("/register", async (req, res) => {
	try {
		const { email, password, username } = req.body;
		
		
		if (!email || !password || !username) {
			return res.status(400).json({ 
				message: "Всі поля обов'язкові",
				field: "all",
				type: "validation"
			});
		}

		
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ 
				message: "Введіть коректний email адресу",
				field: "email",
				type: "validation"
			});
		}

		
		if (password.length < 6) {
			return res.status(400).json({ 
				message: "Пароль має містити мінімум 6 символів",
				field: "password",
				type: "validation"
			});
		}

		
		if (username.length < 2) {
			return res.status(400).json({ 
				message: "Ім'я має містити мінімум 2 символи",
				field: "username",
				type: "validation"
			});
		}

		
		const accountExists = await Account.findOne({ email });
		if (accountExists) {
			return res.status(400).json({ 
				message: "Цей email вже використовується. Спробуйте інший або увійдіть",
				field: "email",
				type: "exists"
			});
		}

		
		const userProfile = new User({ username });
		const savedUser = await userProfile.save();

		
		const salt = await genSalt(10);
		const hashedPassword = await hash(password, salt);

		
		const newAccount = new Account({
			email,
			password: hashedPassword,
			userId: savedUser._id,
		});
		await newAccount.save();

		sendTokenResponse(savedUser, 201, res);
	} catch (err) {
		console.error('Registration error:', err);
		
		
		if (err.code === 11000) {
			const field = Object.keys(err.keyPattern)[0];
			const fieldNames = {
				email: 'email',
				username: 'ім\'я'
			};
			return res.status(400).json({ 
				message: `Цей ${fieldNames[field] || field} вже використовується`,
				field: field,
				type: "duplicate"
			});
		}

		
		if (err.name === 'ValidationError') {
			const errors = Object.values(err.errors).map(e => e.message);
			return res.status(400).json({ 
				message: errors[0] || "Помилка валідації даних",
				field: "validation",
				type: "validation",
				details: errors
			});
		}

		res.status(500).json({ 
			message: "Помилка сервера. Спробуйте пізніше",
			type: "server"
		});
	}
});

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		
		
		if (!email || !password) {
			return res.status(400).json({ 
				message: "Email та пароль обов'язкові",
				field: "all",
				type: "validation"
			});
		}

		
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ 
				message: "Введіть коректний email адресу",
				field: "email",
				type: "validation"
			});
		}

		
		const account = await Account.findOne({ email }).populate("userId");
		if (!account) {
			return res.status(400).json({ 
				message: "Користувача з таким email не знайдено. Перевірте email або зареєструйтесь",
				field: "email",
				type: "not_found"
			});
		}

		
		const isMatch = await compare(password, account.password);
		if (!isMatch) {
			return res.status(400).json({ 
				message: "Неправильний пароль. Спробуйте ще раз",
				field: "password",
				type: "invalid"
			});
		}

		sendTokenResponse(account.userId, 200, res);
	} catch (err) {
		console.error('Login error:', err);
		res.status(500).json({ 
			message: "Помилка сервера. Спробуйте пізніше",
			type: "server"
		});
	}
});

router.post("/google", async (req, res) => {
	try {
		const { idToken } = req.body;
		if (!idToken) {
			return res.status(400).json({ message: "Token is required" });
		}

		const ticket = await client.verifyIdToken({
			idToken,
			audience: process.env.GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();
		const { email, name, picture, sub: googleId } = payload;

		
		let account = await Account.findOne({ email }).populate("userId");

		if (account) {
			
			return sendTokenResponse(account.userId, 200, res);
		}

		
		const newUser = new User({
			username: name || email.split("@")[0],
			avatar: picture,
		});
		const savedUser = await newUser.save();

		
		const randomPassword = await hash(Math.random().toString(36), 10);
		const newAccount = new Account({
			email,
			password: randomPassword,
			userId: savedUser._id,
			googleId, 
		});
		await newAccount.save();

		sendTokenResponse(savedUser, 201, res);
	} catch (err) {
		console.error("Google Auth Error:", err);
		res.status(500).json({ message: "Помилка авторизації Google" });
	}
});

router.post("/guest", async (req, res) => {
	try {
		
		const existingCookie = req.cookies?.dr_guest;
		if (existingCookie) {
			const existingData = JSON.parse(existingCookie);
			
			res
				.status(200)
				.cookie("dr_guest", existingCookie, {
					expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					path: "/",
				})
				.json({
					user: { id: existingData.id, username: existingData.username, isGuest: true },
				});
			return;
		}

		
		const guestId = `guest_${Math.random().toString(36).substr(2, 9)}`;
		const guestData = {
			id: guestId,
			username: "Гість",
			isGuest: true,
			diagnostic: {
				answers: [],
				completedAt: null,
			},
			stats: {
				resilience: 50,
				stabilityDays: 0,
			},
			history: [],
		};

		const guestDataToSave = {
			...guestData
		};

		res
			.status(200)
			.cookie("dr_guest", JSON.stringify(guestDataToSave), {
				expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
			})
			.json({
				id: guestData.id,
				username: guestData.username,
				isGuest: true,
			});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.get("/guest/me", (req, res) => {
	try {
		const guestCookie = req.cookies?.dr_guest;
		if (!guestCookie) {
			return res.status(404).json({ message: "Guest not found" });
		}
		const guestData = JSON.parse(guestCookie);
		res.json(guestData);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.post("/guest/update", (req, res) => {
	try {
		const guestCookie = req.cookies?.dr_guest;
		if (!guestCookie) {
			return res.status(404).json({ message: "Guest not found" });
		}
		const currentData = JSON.parse(guestCookie);
		const updatedData = { 
			...currentData, 
			...req.body,
			stats: {
				...(currentData.stats || {}),
				...(req.body.stats || {})
			}
		};
		
		
		if (req.body.stats && req.body.stats.resilience !== undefined) {
			const score = req.body.stats.resilience;
			const multiplier = Number((0.1 + (score / 100) * 1.4).toFixed(2));
			
			let currentRes = Number(currentData.stats?.resilience);
			if (isNaN(currentRes)) currentRes = 50;

			updatedData.stats.resilienceMultiplier = multiplier;
			updatedData.stats.resilience = currentRes;

			if (!updatedData.history) updatedData.history = [];
			updatedData.history.unshift({
				activityType: 'diagnostic',
				activityName: 'Діагностика стану',
				change: 0,
				newScore: currentRes,
				date: new Date()
			});
		}

		
		const updatedDataToSave = {
			...updatedData,
			history: (updatedData.history || []).slice(0, 10),
		};

		res
			.cookie("dr_guest", JSON.stringify(updatedDataToSave), {
				expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
			})
			.json(updatedData);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.get("/guest/stats", (req, res) => {
	try {
		const guestCookie = req.cookies?.dr_guest;
		if (!guestCookie) {
			return res.status(404).json({ message: "Guest not found" });
		}
		const guestData = JSON.parse(guestCookie);
		res.json(guestData.stats || { resilience: 50, stabilityDays: 0 });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.get("/guest/stats-volume", (req, res) => {
	try {
		const guestCookie = req.cookies?.dr_guest;
		if (!guestCookie) {
			return res.status(404).json({ message: "Guest not found" });
		}
		const guestData = JSON.parse(guestCookie);
		const history = guestData.history || [];
		const now = new Date();
		const getStats = (days) => {
			const cutoff = new Date();
			cutoff.setDate(now.getDate() - days);
			const filtered = history.filter((h) => new Date(h.date) >= cutoff);
			const plus = filtered
				.filter((h) => h.change > 0)
				.reduce((acc, curr) => acc + curr.change, 0);
			const minus = filtered
				.filter((h) => h.change < 0)
				.reduce((acc, curr) => acc + curr.change, 0);
			return { plus, minus, total: plus + minus };
		};

		res.json({
			today: getStats(1),
			week: getStats(7),
			allTime: guestData.stats || { resilience: 50, stabilityDays: 0 },
			history: history,
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.post("/guest/update-resilience", (req, res) => {
	try {
		const { type, name, itemId, metadata = {} } = req.body;
		
		const guestCookie = req.cookies?.dr_guest;
		if (!guestCookie) {
			return res.status(404).json({ message: "Guest not found" });
		}
		
		const guestData = JSON.parse(guestCookie);

		
		if (itemId && type) {
			if (type === 'material' || type === 'complete_material' || type === 'material_view') {
				if (!guestData.completedMaterials) guestData.completedMaterials = [];
				if (!guestData.completedMaterials.includes(itemId)) {
					guestData.completedMaterials.push(itemId);
				}
			} else if (type === 'scenario' || type === 'complete_scenario' || type === 'complete_exercise') {
				if (!guestData.completedScenarios) guestData.completedScenarios = [];
				if (!guestData.completedScenarios.find(s => s.scenarioId === itemId)) {
					guestData.completedScenarios.push({ scenarioId: itemId, date: new Date() });
				}
			}
		}

		
		let currentRes = Number(guestData.stats?.resilience);
		if (isNaN(currentRes)) currentRes = 50;

		const calculatedChange = calculateResilienceChange(type, { ...metadata, currentResilience: currentRes });

		const multiplier = guestData.stats?.resilienceMultiplier || 1.0;
		let finalChange = calculatedChange * multiplier;
		if (calculatedChange < 0) {
			finalChange = Math.min(-1, Math.round(finalChange));
		} else if (calculatedChange > 0) {
			finalChange = Math.max(1, Math.round(finalChange));
		} else {
			finalChange = 0;
		}

		currentRes = Math.max(0, Math.min(100, Math.round(currentRes + finalChange)));

		if (!guestData.stats) guestData.stats = {};
		guestData.stats.resilience = currentRes;

		if (!guestData.history) guestData.history = [];
		if (!metadata.hidden) {
			const historyEntry = {
				activityType: type,
				activityName: name,
				change: finalChange,
				newScore: currentRes,
				date: new Date(),
			};
			guestData.history.unshift(historyEntry);
		}

		if (guestData.history.length > 10) {
			guestData.history = guestData.history.slice(0, 10);
		}

		const guestDataToSave = {
			...guestData,
			history: (guestData.history || []).slice(0, 10),
		};

		const cookieString = JSON.stringify(guestDataToSave);
		
		res
			.cookie("dr_guest", cookieString, {
				expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				secure: false, 
				sameSite: "lax",
				path: "/",
			})
			.json(guestData);
	} catch (err) {
		console.error('❌ GUEST BACKEND ERROR:', err);
		res.status(500).json({ message: err.message });
	}
});

router.post("/guest/diagnostic", (req, res) => {
	try {
		const { answers } = req.body;
		if (!answers || !Array.isArray(answers) || answers.length === 0) {
			return res.status(400).json({ message: "Answers are required" });
		}

		const guestCookie = req.cookies?.dr_guest;
		if (!guestCookie) {
			return res.status(404).json({ message: "Guest not found" });
		}
		const currentData = JSON.parse(guestCookie);

		const score = Math.round(answers.reduce((a, b) => a + b, 0) / answers.length);
		let multiplier = 1.0;
		if (score < 50) {
			multiplier = Number((0.1 + (score / 50) * 0.4).toFixed(2));
		} else {
			multiplier = Number((1.1 + ((score - 50) / 50) * 0.4).toFixed(2));
		}

		const updatedData = {
			...currentData,
			stats: {
				...(currentData.stats || {}),
				resilienceMultiplier: multiplier
			},
			diagnostic: {
				answers,
				completedAt: new Date()
			}
		};

		if (!updatedData.history) updatedData.history = [];
		updatedData.history.unshift({
			activityType: 'diagnostic',
			activityName: 'Діагностика стану',
			change: 0,
			newScore: updatedData.stats.resilience || 50,
			date: new Date()
		});

		const updatedDataToSave = {
			...updatedData,
			history: (updatedData.history || []).slice(0, 10),
		};

		res
			.cookie("dr_guest", JSON.stringify(updatedDataToSave), {
				expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				secure: false,
				sameSite: "lax",
				path: "/",
			})
			.json({ success: true, score, multiplier, stats: updatedData.stats });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});


router.post("/guest/diary", (req, res) => {
	try {
		const guestCookie = req.cookies?.dr_guest;
		if (!guestCookie) {
			return res.status(404).json({ message: "Guest not found" });
		}
		const { mood, content, tags = [] } = req.body;
		const guestData = JSON.parse(guestCookie);

		if (!guestData.diaryEntries) guestData.diaryEntries = [];

		const newEntry = {
			_id: `guest_diary_${Date.now()}`,
			mood,
			content,
			tags,
			date: new Date().toISOString(),
		};

		guestData.diaryEntries.unshift(newEntry);

		
		if (guestData.diaryEntries.length > 20) {
			guestData.diaryEntries = guestData.diaryEntries.slice(0, 20);
		}

		res
			.cookie("dr_guest", JSON.stringify(guestData), {
				expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
			})
			.json({ success: true, entry: newEntry });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});


router.get("/guest/diary", (req, res) => {
	try {
		const guestCookie = req.cookies?.dr_guest;
		if (!guestCookie) {
			return res.json({ entries: [], total: 0 });
		}
		const guestData = JSON.parse(guestCookie);
		const entries = guestData.diaryEntries || [];
		res.json({ entries, total: entries.length });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});



router.post("/migrate-guest", async (req, res) => {
	try {
		const { email, password, username } = req.body;
		const guestCookie = req.cookies?.dr_guest;
		
		
		if (!email || !password || !username) {
			return res.status(400).json({ 
				message: "Всі поля обов'язкові",
				field: "all",
				type: "validation"
			});
		}

		
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ 
				message: "Введіть коректний email адресу",
				field: "email",
				type: "validation"
			});
		}

		
		if (password.length < 6) {
			return res.status(400).json({ 
				message: "Пароль має містити мінімум 6 символів",
				field: "password",
				type: "validation"
			});
		}

		
		if (username.length < 2) {
			return res.status(400).json({ 
				message: "Ім'я має містити мінімум 2 символи",
				field: "username",
				type: "validation"
			});
		}

		
		const accountExists = await Account.findOne({ email });
		if (accountExists) {
			return res.status(400).json({ 
				message: "Цей email вже використовується. Спробуйте інший або увійдіть",
				field: "email",
				type: "exists"
			});
		}

		
		let guestData = null;
		if (guestCookie) {
			guestData = JSON.parse(guestCookie);
		}

		
		const userProfile = new User({
			username,
			stats: guestData?.stats || { resilience: 50, stabilityDays: 0 },
			history: guestData?.history || [],
			diagnostic: guestData?.diagnostic || { answers: [], completedAt: null },
			completedScenarios: guestData?.completedScenarios || [],
			completedMaterials: guestData?.completedMaterials || [],
		});
		const savedUser = await userProfile.save();

		const salt = await genSalt(10);
		const hashedPassword = await hash(password, salt);

		const newAccount = new Account({
			email,
			password: hashedPassword,
			userId: savedUser._id,
		});
		await newAccount.save();

		
		res.clearCookie("dr_guest");

		
		sendTokenResponse(savedUser, 201, res);
	} catch (err) {
		
		
		if (err.code === 11000) {
			const field = Object.keys(err.keyPattern)[0];
			const fieldNames = {
				email: 'email',
				username: 'ім\'я'
			};
			return res.status(400).json({ 
				message: `Цей ${fieldNames[field] || field} вже використовується`,
				field: field,
				type: "duplicate"
			});
		}

		
		if (err.name === 'ValidationError') {
			const errors = Object.values(err.errors).map(e => e.message);
			return res.status(400).json({ 
				message: errors[0] || "Помилка валідації даних",
				field: "validation",
				type: "validation",
				details: errors
			});
		}

		res.status(500).json({ 
			message: "Помилка сервера. Спробуйте пізніше",
			type: "server"
		});
	}
});


router.get("/profile", async (req, res) => {
	try {
		const token = req.cookies?.dr_token || req.header("x-auth-token");
		if (!token) {
			return res.status(401).json({ message: "Not authenticated" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
		const user = await User.findById(decoded.id);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.json({
			id: user._id,
			username: user.username,
			email: user.email,
			isGuest: user.isGuest,
			stats: user.stats,
			badges: user.badges || [],
			completedScenarios: user.completedScenarios || [],
			completedMaterials: user.completedMaterials || [],
			unlockedScenarios: user.unlockedScenarios || [],
			diagnostic: user.diagnostic,
			history: user.history || [],
			diaryEntries: user.diaryEntries || [],
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});


router.post("/activity", async (req, res) => {
	try {
		const token = req.cookies?.dr_token || req.header("x-auth-token");
		if (!token) {
			return res.status(401).json({ message: "Not authenticated" });
		}
		if (token === "guest_mode") {
			return res.json({ success: true, guest: true });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
		const user = await User.findById(decoded.id);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const lastActive = user.stats.lastActiveDate;
		let newStreak = user.stats.streak || 0;

		if (lastActive) {
			const lastDate = new Date(lastActive);
			lastDate.setHours(0, 0, 0, 0);

			const diffTime = today - lastDate;
			const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

			if (diffDays === 1) {
				newStreak += 1;
				
				if (newStreak >= 2) {
					user.stats.resilience = Math.min(100, (user.stats.resilience || 50) + 6);
					user.history.unshift({
						activityType: 'streak_bonus',
						activityName: `${newStreak} дні поспіль`,
						change: 6,
						newScore: user.stats.resilience,
						date: new Date()
					});
				}
			} else if (diffDays > 1) {
				newStreak = 1;
			}
		} else {
			newStreak = 1;
		}

		user.stats.streak = newStreak;
		user.stats.lastActiveDate = new Date();

		if (newStreak > (user.stats.longestStreak || 0)) {
			user.stats.longestStreak = newStreak;
		}

		
		const newBadges = [];
		const streakBadges = [
			{ days: 3, id: "streak_3", name: "3 дні стабільності", icon: "🔥", description: "3 дні активності поспіль" },
			{ days: 7, id: "streak_7", name: "Тиждень стабільності", icon: "🌟", description: "7 днів активності поспіль" },
			{ days: 30, id: "streak_30", name: "Місяць стабільності", icon: "👑", description: "30 днів активності поспіль" },
		];

		for (const badge of streakBadges) {
			if (newStreak >= badge.days && !user.badges.find(b => b.id === badge.id)) {
				user.badges.push(badge);
				newBadges.push(badge);
			}
		}

		await user.save();

		res.json({
			streak: newStreak,
			longestStreak: user.stats.longestStreak,
			newBadges,
			allBadges: user.badges,
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});


router.post("/complete-scenario", async (req, res) => {
	try {
        const token = req.cookies?.dr_token || req.header("x-auth-token");
        const guestCookie = req.cookies?.dr_guest;
        const { scenarioId, score } = req.body;

		
		if (guestCookie && (!token || token === 'guest_mode')) {
			const guestData = JSON.parse(guestCookie);

			if (!guestData.completedScenarios) {
				guestData.completedScenarios = [];
			}

			const alreadyCompleted = guestData.completedScenarios.find(s => s.scenarioId === scenarioId);
			if (!alreadyCompleted) {
				guestData.completedScenarios.push({ scenarioId, score, date: new Date() });
				
				
				let scenario;
				if (mongoose.Types.ObjectId.isValid(scenarioId)) {
					scenario = await Scenario.findById(scenarioId);
				} else {
					scenario = await Scenario.findOne({ scenarioId: scenarioId });
				}
				const resilienceChange = score >= 50 ? 4 : -4;
				if (!guestData.stats) guestData.stats = { resilience: 50 };
				const oldResilience = guestData.stats.resilience || 50;
				guestData.stats.resilience = Math.max(0, Math.min(100, oldResilience + resilienceChange));

				if (!guestData.history) guestData.history = [];
				guestData.history.unshift({
					activityType: 'exercise_finish',
					activityName: `Тренажер: ${scenario ? scenario.name : ''}`,
					change: resilienceChange,
					newScore: guestData.stats.resilience,
					date: new Date()
				});
			}
			
			res.cookie("dr_guest", JSON.stringify(guestData), {
				expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
			});

			return res.json({
				completedScenarios: guestData.completedScenarios,
			});
		}
		
		
		if (token) {
			const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
			const user = await User.findById(decoded.id);
	
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}
	
			
			const alreadyCompleted = user.completedScenarios.some(s => 
				s.scenarioId === scenarioId || (s._id && s._id.toString() === scenarioId)
			);
			
			if (!alreadyCompleted) {
				user.completedScenarios.push({ 
					scenarioId: scenarioId, 
					score: score, 
					completedAt: new Date() 
				});
			}
	
			let scenario;
			if (mongoose.Types.ObjectId.isValid(scenarioId)) {
				scenario = await Scenario.findById(scenarioId);
			} else {
				scenario = await Scenario.findOne({ scenarioId: scenarioId });
			}

			
			try {
				const resilienceChange = score >= 50 ? 4 : -4;
				let currentRes = Number(user.stats.resilience);
				if (isNaN(currentRes)) currentRes = 50;
				const newResilience = Math.max(0, Math.min(100, currentRes + resilienceChange));
				user.stats.resilience = newResilience;

				
				const ActivityLog = (await import('../models/ActivityLog.js')).default;
				await ActivityLog.create({
					userId: user._id,
					type: 'exercise_finish',
					name: `Тренажер: ${scenario ? scenario.name : 'Вправа'}`,
					change: resilienceChange
				});

				
				user.history.unshift({
					activityType: 'exercise_finish',
					activityName: `Тренажер: ${scenario ? scenario.name : 'Вправа'}`,
					change: resilienceChange,
					newScore: newResilience,
					date: new Date()
				});

				const io = req.app.get('io');
				if (io) {
					io.to(user._id.toString()).emit('resilienceUpdate', { resilience: newResilience });
				}
			} catch (statsErr) {
				console.error("Failed to sync stats during scenario completion:", statsErr);
			}

			
			const newBadges = [];
			const completedCount = user.completedScenarios.length;
	
			if (completedCount === 1 && !user.badges.find(b => b.id === "first_scenario")) {
				user.badges.push({
					id: "first_scenario",
					name: "Перша перемога",
					icon: "🎯",
					description: "Завершено перший сценарій",
				});
				newBadges.push(user.badges[user.badges.length - 1]);
			}
	
			if (completedCount === 5 && !user.badges.find(b => b.id === "expert_5")) {
				user.badges.push({
					id: "expert_5",
					name: "Експерт",
					icon: "🏆",
					description: "Завершено 5 сценаріїв",
				});
				newBadges.push(user.badges[user.badges.length - 1]);
			}
	
			
			if (scenario && scenario.nextUnlock) {
				if (!user.unlockedScenarios.includes(scenario.nextUnlock)) {
					user.unlockedScenarios.push(scenario.nextUnlock);
				}
			}
	
			await user.save();
	
			return res.json({
				completedScenarios: user.completedScenarios,
				unlockedScenarios: user.unlockedScenarios,
				newBadges,
			});
		}

		return res.status(401).json({ message: "Not authenticated" });

	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

export default router;
