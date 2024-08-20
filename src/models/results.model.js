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
    score: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },{ timestamps: true});
  
  export const Result = mongoose.model('Result', ResultSchema);
  