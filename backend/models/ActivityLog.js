import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		type: {
			type: String,
			required: true, 
		},
		name: {
			type: String, 
		},
		change: {
			type: Number,
			default: 0, 
		},
		metadata: {
			type: mongoose.Schema.Types.Mixed, 
		},
	},
	{
		timestamps: { createdAt: true, updatedAt: false }, 
	}
);

ActivityLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("ActivityLog", ActivityLogSchema);
