import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import "../configure/auth.js"
import passport from "passport";

// Manual User Signup
const createUser = asyncHandler(async (req, res, next) => {
  console.log("User Body",req.body)
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    throw new ApiError(400, "Please provide all required fields");
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
    .json(new ApiResponse(201, user, "User created successfully"));
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
    .cookie("token", token, { httpOnly: true })
    .json(new ApiResponse(200, user, "User logged in successfully"));
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
      .cookie("token", token, { httpOnly: true })
      .redirect("https://www.genailearning.in/Main/dash");
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
      .cookie("token", token, { httpOnly: true })
      .redirect("https://www.genailearning.in/Main/dash");
  })(req, res, next);
};

export {
  createUser,
  loginUser,
  googleAuth,
  googleCallback,
  linkedinAuth,
  linkedinCallback,
};
