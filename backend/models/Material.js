import { Schema, model } from "mongoose";

const MaterialSchema = new Schema({
	materialId: { type: String, required: true, unique: true },
	title: { type: String, required: true },
	desc: { type: String, required: true },
	category: {
		type: String,
		enum: ["general", "anxiety", "stress", "apathy", "resilience", "support", "mindfulness"],
		default: "general",
	},
	type: { type: String, enum: ["text", "video", "audio"], default: "text" },
	icon: { type: String, default: "📖" },
	image: { type: String }, 
	url: { type: String },   
	content: { type: String, required: true },
	duration: { type: String, default: "5 хв" },
	minResilience: { type: Number, default: 0 },
	maxResilience: { type: Number, default: 100 },
});

export default model("Material", MaterialSchema);
