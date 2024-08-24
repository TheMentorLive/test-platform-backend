import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';
import Razorpay from 'razorpay';

dotenv.config({
    path:'./.env'
});
export const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`server is running at port:${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed !!! ", err);
})
