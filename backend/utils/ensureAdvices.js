import Advice from "../models/Advice.js";
import { ADVICE_DATA } from "../data/adviceData.js";

export async function ensureAdvices() {
	for (const advice of ADVICE_DATA) {
		await Advice.findOneAndUpdate(
			{ title: advice.title },
			advice,
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);
	}

	const advices = await Advice.find().lean();
	console.log(`[advices] ${advices.length} advice(s) in database`);
	return advices;
}
