import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema({
    submissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
        required: true,
    },
    totalQuestions: {
        type: Number,
        required: true,
    },
    correctAnswers: {
        type: Number,
        required: true,
    },
    incorrectAnswers: {
        type: Number,
        required: true,
    },
    skippedQuestions: {
        type: Number,
        default: 0,
    },
    accuracy: {
        type: Number,
        required: true,
        // Percentage of correct answers out of total attempted questions
    },
    score: {
        type: Number,
        required: true,
    },
    maxScore: {
        type: Number,
        required: true,
        // Max score possible (e.g., 1 point per question)
    },
    percentage: {
        type: Number,
        required: true,
        // Score as a percentage of maxScore
    },
    passed: {
        type: Boolean,
        required: true,
    },
    evaluatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

export const Result = mongoose.model('Result', ResultSchema);
