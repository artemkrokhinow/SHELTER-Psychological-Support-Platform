import { Schema, model } from "mongoose";

const AdviceSchema = new Schema({
    title: { type: String, required: true },
	text: { type: String, required: true },
	category: { type: String, default: "general" },
	relevance: { type: String, enum: ["low", "medium", "high"], default: "medium" },
	moodContext: { type: String, enum: ["anxiety", "stress", "calm", "happy", "exhausted", "any"], default: "any" }
});

export default model("Advice", AdviceSchema, "advice");
