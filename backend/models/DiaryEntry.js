import mongoose from "mongoose";

const DiaryEntrySchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		mood: {
			type: Number,
			required: true, 
		},
		content: {
			type: String,
			required: true,
		},
		tags: [String],
		wordCount: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: { createdAt: true, updatedAt: true },
	}
);

DiaryEntrySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("DiaryEntry", DiaryEntrySchema);
