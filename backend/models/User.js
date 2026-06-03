import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
	username: { type: String, required: true },
	email: { type: String },
	password: { type: String },
	isGuest: { type: Boolean, default: false },
	diagnostic: {
		answers: [String],
		completedAt: { type: Date },
	},
	stats: {
		resilience: { type: Number, default: 50 },
		resilienceMultiplier: { type: Number, default: 1.0 },
		stabilityDays: { type: Number, default: 0 },
		streak: { type: Number, default: 0 },
		longestStreak: { type: Number, default: 0 },
		lastActiveDate: { type: Date },
	},
	badges: [
		{
			id: { type: String },
			name: { type: String },
			description: { type: String },
			icon: { type: String },
			unlockedAt: { type: Date, default: Date.now },
		},
	],
	completedScenarios: [
		{
			scenarioId: { type: String },
			completedAt: { type: Date, default: Date.now },
			score: { type: Number },
		},
	],
	completedMaterials: [{ type: String }],
	unlockedScenarios: [{ type: String }],
	history: [
		{
			date: { type: Date, default: Date.now },
			activityType: { type: String },
			activityName: { type: String },
			change: { type: Number },
			newScore: { type: Number },
		},
	],
	preferences: {
		checkInTime: { type: String, default: "09:00" },
		notificationsEnabled: { type: Boolean, default: true },
	},
});

export default mongoose.model("User", UserSchema);
