import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import "../configure/auth.js"
import passport from "passport";
import nodemailer from "nodemailer";
import { sendEmail } from "../utils/sendMail.js";
import crypto from "crypto";

const options = {
  httpOnly: true,
  sameSite: "None",
  secure: process.env.IS_PRODUCTION == "true" ? true : false,
  maxAge : 24*60*60*1000 // 1 day
};
// Manual User Signup
const createUser = asyncHandler(async (req, res, next) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return next(new ApiError(400, "Please provide all required fields"));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  const user = await User.create({ email, name, password });
  if (!user) {
    throw new ApiError(400, "User not created");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, null, "User created successfully"));
});

// Manual User Login
const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide all required fields");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(400, "Invalid credentials");
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  if (!token) {
    throw new ApiError(500, "Token not generated");
  }

  user.password = undefined; // Remove password from response
  return res
  .status(200)
  .cookie("token",token,{httpOnly:true,sameSite:"None",secure:true,maxAge:24*60*60*1000})
  .json(new ApiResponse(200, { user, token }, "User logged in successfully"));

});

// Google OAuth Login
const googleAuth = passport.authenticate("google", { scope: ["profile", "email"] });

// Google OAuth Callback
const googleCallback = (req, res, next) => {
  passport.authenticate("google", (err, user) => {
    console.log("Error", err);
    if (err || !user) {
      res.redirect("https://www.genailearning.in/auth/failed");
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res
      .cookie("token",token,{httpOnly:true,sameSite:"None",secure:true,maxAge:24*60*60*1000})
      .redirect("https://www.genailearning.in/dash-admin/DashboardPage");
  })(req, res, next);
};

// LinkedIn OAuth Login
const linkedinAuth = passport.authenticate("linkedin", { scope: ["r_emailaddress", "r_liteprofile"] });

// LinkedIn OAuth Callback
const linkedinCallback = (req, res, next) => {
  passport.authenticate("linkedin", (err, user) => {
    if (err || !user) {
      res.redirect("https://www.genailearning.in/auth/failed");
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res
      .cookie("token", token,{httpOnly:true,sameSite:"None",secure:true,maxAge:24*60*60*1000})
      .redirect("https://www.genailearning.in/dash-admin/DashboardPage");
  })(req, res, next);
};

// Logout User
const logoutUser = asyncHandler(async (req, res, next) => {
  // Clear the cookie containing the JWT token
  res
    .status(200)
    .clearCookie("token", { httpOnly: true })
    .json(new ApiResponse(200, null, "User logged out successfully"));
});


const requestPasswordReset = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Generate reset token
  const resetPasswordToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordTokenExpiry = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send reset token via email
  const resetUrl = `https://www.genailearning.in/Main/resetps/${resetPasswordToken}`;
  const message = `Click <a href="${resetUrl}">here</a> to reset your password`;
  try {
    await sendEmail(email, "Password Reset", message);
    return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset email sent"));
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();
    console.log("error", error);
    throw new ApiError(500, "Email could not be sent");
  }
});

const resetPassword = asyncHandler(async(req,res,next)=> {
  const {password,resetPasswordToken} = req.body;
  if(!password || !resetPasswordToken) {
      return next(new ApiError(400,'Please provide password and resetPasswordToken'))
  }
  const user = await User.findOne({
      resetPasswordToken,
      resetPasswordTokenExpiry:{$gt:Date.now()}
  })

  if(!user) {
      return next(new ApiError(400,'Token is invlaid or expired , please try again'))
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiry = undefined;

  await user.save();

  return res
  .status(200)
  .json(new ApiResponse(200, null, "Password reset successfully"));
});

const updatePassword = asyncHandler(async(req,res,next)=> {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  if(!user) {
      return next(new ApiError(400,'User not found'))
  }
  if(user.comparePassword(oldPassword)){
  user.password = newPassword;
  await user.save();

  return res
  .status(200)
  .json(new ApiResponse(200, null, "Password updated successfully"));
  } else {
    return next(new ApiError(400,'OldPassword is inCorrect'));
  }
});

const updateProfile = asyncHandler(async(req,res,next)=> {
  const {name} = req.body;

  const user = await User.findById(req.user._id);

  if(!user) {
      return next(new ApiError(400,'User not found'))
  }

  user.name = name;
  await user.save();

  return res
  .status(200)
  .json(new ApiResponse(200, null, "Profile updated successfully"));
});


export {
  createUser,
  loginUser,
  googleAuth,
  googleCallback,
  linkedinAuth,
  linkedinCallback,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  updatePassword,
  updateProfile
};
