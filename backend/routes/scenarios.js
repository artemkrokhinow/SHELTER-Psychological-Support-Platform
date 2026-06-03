import express from "express";
import mongoose from "mongoose";
import Scenario from "../models/Scenario.js";

const router = express.Router();

router.get("/", async (req, res) => {
	try {
		const startTime = Date.now();
		const scenarios = await Scenario.find()
			.maxTimeMS(30000) 
			.lean() 
			.exec();

		const duration = Date.now() - startTime;

		res.json(scenarios);
	} catch (err) {
		console.error(`[${new Date().toISOString()}] ❌ Error fetching scenarios:`, err.message);
		console.error(`[${new Date().toISOString()}] Full error:`, err);
		console.error(`[${new Date().toISOString()}] Error name:`, err.name);
		console.error(`[${new Date().toISOString()}] Error code:`, err.code);
		res.status(500).json({ message: err.message, error: err.name });
	}
});

router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		let scenario;
		
		
		scenario = await Scenario.findOne({ scenarioId: id });
		
		
		if (!scenario && mongoose.Types.ObjectId.isValid(id)) {
			scenario = await Scenario.findById(id);
		}

		if (!scenario)
			return res.status(404).json({ message: "Сценарій не знайдено" });
		res.json(scenario);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.post("/", async (req, res) => {
	try {
		const newScenario = new Scenario(req.body);
		const saved = await newScenario.save();
		res.status(201).json(saved);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

router.delete("/:id", async (req, res) => {
	try {
		await Scenario.findByIdAndDelete(req.params.id);
		res.json({ message: "Сценарій видалено" });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.put("/:id", async (req, res) => {
	try {
		const updated = await Scenario.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});
		res.json(updated);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

export default router;
