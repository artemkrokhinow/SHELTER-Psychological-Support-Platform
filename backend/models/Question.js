import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{
        text: { type: String, required: true },
        value: { type: Number, required: true }
    }],
    order: { type: Number, default: 0 },
    category: { type: String, default: "general" }
});

export default mongoose.model("Question", QuestionSchema);
