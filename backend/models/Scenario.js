import { Schema, model } from "mongoose";

const ScenarioSchema = new Schema({
	scenarioId: { type: String, required: true, unique: true },
	name: { type: String, required: true },
	type: {
		type: String,
		enum: ["dialogue", "find-differences", "video", "audio", "sorting"],
		default: "dialogue",
	},
	category: {
		type: String,
		enum: ["general", "anxiety", "stress", "apathy"],
		default: "general",
	},
	duration: { type: String, default: "5 хв" },
	difficulty: { type: Number, default: 50, min: 0, max: 100 },
	image: { type: String }, 
	description: { type: String }, 
	minResilience: { type: Number, default: 0 },
	maxResilience: { type: Number, default: 100 },
	nodes: { type: Schema.Types.Mixed },
	levels: [{
		image: { type: String },
		videoUrl: { type: String },
		videoTranscript: { type: String },
		audioUrl: { type: String },
		audioTranscript: { type: String },
		differences: [{
			x: { type: Number },
			y: { type: Number },
			radius: { type: Number },
		}],
	}],
	content: { type: Schema.Types.Mixed },
	categories: [{
		id: { type: Number },
		name: { type: String },
		color: { type: String },
	}],
	items: [{
		text: { type: String },
		categoryId: { type: Number },
	}],
});

export default model("Scenario", ScenarioSchema);
