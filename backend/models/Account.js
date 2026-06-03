import { Schema, model } from "mongoose";

const AccountSchema = new Schema({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	userId: { type: Schema.Types.ObjectId, ref: "User" },
});

export default model("Account", AccountSchema);
