import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";



const createUser = asyncHandler(async (req, res, next) => {
    const {email, name, password} = req.body;

    if(!email || !name || !password){
        return next(new ApiError(400, "Please provide all required fields"));
    }

    const existingUser = await User.findOne({email});
    if(existingUser){
        return next(new ApiError(400, "User already existswith this email"));
    }

    const user = await User.create({email, name, password});
    if(!user){
        return next(new ApiError(400, "User not created"));
    }

    return res
    .status(201)
    .json(new ApiResponse(201, user, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res, next) => {
    const {email, password} = req.body;

    if(!email || !password){
        return next(new ApiError(400, "Please provide all required fields"));
    }

    const user = await User.findOne({email});
    if(!user){
        return next(new ApiError(400, "User not found"));
    }

    const isMatch = await user.comparePassword(password);
    if(!isMatch){
        return next(new ApiError(400, "Invalid credentials"));
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    if(!token){
        return next(new ApiError(500, "Token not generated"));
    }
    user.password = undefined;
    return res
    .status(200)
    .cookie('token', token, { httpOnly: true })
    .json(new ApiResponse(200, user, "User logged in successfully"));
});

export {
    createUser,
    loginUser
}
