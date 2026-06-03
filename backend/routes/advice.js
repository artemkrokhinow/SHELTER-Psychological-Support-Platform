import express from "express";
import Advice from "../models/Advice.js";

const router = express.Router();

router.get("/", async (req, res) => {
	try {
		const advices = await Advice.find();
		res.json(advices);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.get("/random", async (req, res) => {
	try {
		const count = await Advice.countDocuments();
		const random = Math.floor(Math.random() * count);
		const advice = await Advice.findOne().skip(random);
		res.json(advice);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

export default router;
