import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { instance } from "../index.js";
import crypto from "crypto";


const checkout = asyncHandler(async (req, res) => {
    // console.log("body",req.body)
    if(!req.body.amount) {
        return res.status(400).json(new ApiError(400, "Amount is required"))
    }
    const options = {
        amount: Number(req.body.amount) * 100,
        currency: "INR"
    };
    const order = await instance.orders.create(options)

    return res.status(200).json(new ApiResponse(200, order, "Order created successfully"))
})

const getrazorpaykey = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json( new ApiResponse(200,{key: instance.key_id}, "Razorpay key fetched successfully"))
})

const paymentVerification = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    if(!userId) {
        return res.status(400).json(new ApiError(400, "User ID is required"))
    }
    const user = await User.findById(userId);
    if(!user) {
        return res.status(404).json(new ApiError(404, "User not found"))
    }
    const {razorpay_order_id, razorpay_payment_id, razorpay_signature, testId} = req.body;
    // console.log("req.body",req.body);
    if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !testId) {
        return res.status(400).json(new ApiError(400, "razorpay_order_id, razorpay_payment_id and razorpay_signature are required"))
    }
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest('hex');
    const isVerified = expectedSignature === razorpay_signature;
    if(isVerified) { 
        const payment = await Payment.create({
            userId,
            testId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        })
        if(!payment) {
            return res
            .status(500)
            .json(new ApiError(500, "Payment could not be created"))
        }
        return res
        .status(200)
        .json(new ApiResponse(200, payment, "Payment verified successfully"))
    } else {
        return res
        .status(400)
        .json(new ApiError(400, "Payment verification failed"))
    }
})

const isElgibleForTest = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if(!userId) {
        return res.status(400).json(new ApiError(400, "User ID is required"))
    }
    const user = await User.findById(userId);
    if(!user) {
        return res.status(404).json(new ApiError(404, "User not found"))
    }
    const payment = await Payment.find({userId});
    return res
    .status(200)
    .json(new ApiResponse(200, {payment}, "User is elgible for the test"))
});

const getAllPayments = asyncHandler(async (req, res) => {
        // Fetch all payments from the database
        const allPayments = await Payment.find();

        // Month names for reference
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // Initialize the finalMonths object to store counts
        const finalMonths = {
            January: 0,
            February: 0,
            March: 0,
            April: 0,
            May: 0,
            June: 0,
            July: 0,
            August: 0,
            September: 0,
            October: 0,
            November: 0,
            December: 0
        };

        // Group payments by month
        allPayments.forEach((payment) => {
            const paymentMonth = new Date(payment.createdAt).getMonth(); // Assuming createdAt is the payment date
            const monthName = monthNames[paymentMonth];
            finalMonths[monthName] += 1;
        });

        // Create a monthly sales record array
        const monthlySalesRecord = monthNames.map((monthName) => finalMonths[monthName]);

        // Respond with the aggregated data
        res.status(200).json(new ApiResponse(200, {
            allPayments,
            monthlySalesRecord,
            finalMonths
        }, 'All Payments fetched successfully'));
});

export {
    checkout ,
    getrazorpaykey,
    paymentVerification,
    isElgibleForTest,
    getAllPayments
}