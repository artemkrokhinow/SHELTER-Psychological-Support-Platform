import mongoose from "mongoose";
import dotenv from "dotenv";
import { ensureSortingScenarios } from "./utils/ensureSortingScenarios.js";

dotenv.config();

const dbURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shelter_db";

mongoose
	.connect(dbURI)
	.then(async () => {
		const scenarios = await ensureSortingScenarios();
		console.log(`Sorting scenarios ready: ${scenarios.length}`);
		scenarios.forEach((s) => console.log(`  - ${s.scenarioId}: ${s.name}`));
		process.exit(0);
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
