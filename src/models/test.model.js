import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
 },
 type:{
    type: String,
    required: true,
    enum : ['JEE', 'NEET']
 },
  description: {
    type: String
 },
  isPaid: {
      type: Boolean,
      default: false
   },
   price: {
      type: Number,
      default: 0
   },
  questions: [
    { type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionBank'
    }
 ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
 }
},{ timestamps:true });

export const Test = mongoose.model("Test",testSchema);
