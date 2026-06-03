import Scenario from "../models/Scenario.js";
import { SORTING_SCENARIOS } from "../data/sortingScenarios.js";

export async function ensureSortingScenarios() {
	for (const scenario of SORTING_SCENARIOS) {
		await Scenario.findOneAndUpdate(
			{ scenarioId: scenario.scenarioId },
			scenario,
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);
	}

	const scenarios = await Scenario.find({ type: "sorting" }).lean();
	console.log(`[sorting] ${scenarios.length} scenario(s) in database`);
	return scenarios;
}
