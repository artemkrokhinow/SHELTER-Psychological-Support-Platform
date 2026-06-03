import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";

const router = express.Router();

router.post("/update-resilience", async (req, res) => {
	try {
		const { userId, type, name, metadata = {} } = req.body;

		if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ message: "Invalid ID" });
		}

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		let currentRes = Number(user.stats.resilience);
		if (isNaN(currentRes)) currentRes = 50;

		const { calculateResilienceChange } = await import('../utils/resilienceLogic.js');
		const calculatedChange = calculateResilienceChange(type, { ...metadata, currentResilience: currentRes });

		const multiplier = user.stats.resilienceMultiplier || 1.0;
		let finalChange = calculatedChange * multiplier;
		if (calculatedChange < 0) {
			finalChange = Math.min(-1, Math.round(finalChange));
		} else if (calculatedChange > 0) {
			finalChange = Math.max(1, Math.round(finalChange));
		} else {
			finalChange = 0;
		}

		currentRes = Math.max(0, Math.min(100, Math.round(currentRes + finalChange)));

		user.stats.resilience = currentRes;
		user.history.unshift({
			activityType: type,
			activityName: name,
			change: finalChange,
			newScore: currentRes,
			date: new Date(),
		});

		await user.save();
		
		const io = req.app.get('io');
		if (io) {
			io.to(userId).emit('resilienceUpdate', { resilience: user.stats.resilience });
		}

		res.json(user);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.post("/update-progress", async (req, res) => {
	try {
		const { userId, itemId, type } = req.body;

		if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ message: "Invalid ID" });
		}

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (type === "material") {
			if (!user.completedMaterials.includes(itemId)) {
				user.completedMaterials.push(itemId);
			}
		} else if (type === "scenario") {
			const exists = user.completedScenarios.find(s => s.scenarioId === itemId);
			if (!exists) {
				user.completedScenarios.push({ scenarioId: itemId });
			}
		}

		await user.save();
		res.json(user);
	} catch (err) {
		console.error("Error in update-progress:", err);
		res.status(500).json({ message: err.message });
	}
});

router.get("/:id/profile", async (req, res) => {

	try {
		if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({ message: "Invalid ID" });
		}
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ message: "User not found" });
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
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.get("/:id/stats-volume", async (req, res) => {
	try {
		if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({ message: "Invalid ID" });
		}
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ message: "User not found" });
		const now = new Date();
		const getStats = (days) => {
			const cutoff = new Date();
			cutoff.setDate(now.getDate() - days);
			const filtered = (user.history || []).filter(
				(h) => new Date(h.date) >= cutoff,
			);
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
			allTime: user.stats,
			history: user.history,
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.get("/:id/stats", async (req, res) => {
	try {
		if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({ message: "Invalid ID" });
		}

		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json(user.stats);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

export default router;
