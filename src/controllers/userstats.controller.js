import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Payment } from "../models/payment.model.js";
import { Test } from "../models/test.model.js";
import { Result } from "../models/results.model.js";


const getPaymentHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if(!userId) {
        return res.status(400).json(new ApiError(400, "User ID is required"))
    }
    const user = await User.findById(userId);
    if(!user) {
        return res.status(404).json(new ApiError(404, "User not found"))
    }
    const payments = await Payment.find({userId}).populate("testId");
    return res
    .status(200)
    .json(new ApiResponse(200, payments, "Payment history fetched successfully"))
});

const getTestHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if(!userId) {
        return res.status(400).json(new ApiError(400, "User ID is required"))
    }
    const user = await User.findById(userId);
    if(!user) {
        return res.status(404).json(new ApiError(404, "User not found"))
    }
    const results = await Result.find({userId}).populate("testId");
    return res
    .status(200)
    .json(new ApiResponse(200, results, "Test history fetched successfully"))
});

const latestTestScore = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if(!userId) {
        return res.status(400).json(new ApiError(400, "User ID is required"))
    }
    const user = await User.findById(userId);
    if(!user) {
        return res.status(404).json(new ApiError(404, "User not found"))
    }
    const results = await Result.find({userId}).populate("testId");
    if(!results.length) {
        return res.status(404).json(new ApiError(404, "No test results found"))
    }
    const latestTest = results[results.length - 1];
    return res
    .status(200)
    .json(new ApiResponse(200, latestTest, "Latest test fetched successfully"))
});

export { getPaymentHistory, getTestHistory, latestTestScore }