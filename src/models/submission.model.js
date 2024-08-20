import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
  },
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionBank',
        required: true,
      },
      selectedOptionIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'QuestionBank.options',
        },
      ],
    },
  ],
},{ timestamps: true});

export const Submission = mongoose.model('Submission', SubmissionSchema);
