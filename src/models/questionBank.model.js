import mongoose from 'mongoose';


const optionSchema = new mongoose.Schema({
  optionText: {
    type: String,
    required: true
},
  isCorrect: {
    type: Boolean,
    required: true
}
});

const questionSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
},
  questionText: {
    type: String,
    required: true
},
  options: [optionSchema],
  explanation: {
    type: String
},
  difficultyLevel: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
},
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
}, 
  topic:{
    type: String,
  }
},{ timestamps: true });


export const QuestionBank = mongoose.model('QuestionBank', questionSchema);
