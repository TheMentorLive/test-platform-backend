import mongoose from 'mongoose';

const getInTouchSchema = new mongoose.Schema({
    fullName:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    message:{
        type: String,
    }
},{timestamps:true});

export const GetInTouch = mongoose.model('GetInTouch',getInTouchSchema);