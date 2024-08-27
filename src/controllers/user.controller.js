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
  if (!user.isOtpVerified) {
    throw new ApiError(400, "Please verify your email with the OTP sent");
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
  .json(new ApiResponse(200, { user }, "User logged in successfully"));

});

async function otpGenerate(user) {
  const otp = Math.floor(1000 + Math.random() * 9000);

  user.otp = otp;
  user.otpExpiry = Date.now() + 600000; // 10 minutes
  await user.save();

  const message = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 30px; text-align: center; background-color: #0070f3; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; font-size: 28px; margin: 0;">OTP Verification</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="font-size: 16px; line-height: 1.5; color: #333333; margin: 0 0 20px;">Hello,</p>
                            <p style="font-size: 16px; line-height: 1.5; color: #333333; margin: 0 0 20px;">Your One-Time Password (OTP) for verification is:</p>
                            <p style="font-size: 32px; font-weight: bold; text-align: center; color: #0070f3; margin: 30px 0; letter-spacing: 5px;">${otp}</p>
                            <p style="font-size: 16px; line-height: 1.5; color: #333333; margin: 0 0 20px;">This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
                            <p style="font-size: 16px; line-height: 1.5; color: #333333; margin: 0 0 20px;">If you didn't request this OTP, please ignore this email.</p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; text-align: center; background-color: #f8f8f8; border-radius: 0 0 8px 8px;">
                            <p style="font-size: 14px; color: #666666; margin: 0;">This is an automated message, please do not reply.</p>
                            <p style="font-size: 14px; color: #666666; margin: 10px 0 0;">&copy; ${new Date().getFullYear()} The Mentor. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

  try {
    await sendEmail(user.email, "OTP for account verification", message);
    console.log("OTP sent to email");
    return true;
  } catch (error) {
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    throw new ApiError(500, "Email could not be sent");
  }
}

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

  const user = new User({ email, name, password });

  if(!user) {
    return next(new ApiError(500, "User creation failed"));
  }

  try {

    const otpGenerated = await otpGenerate(user);
    if (!otpGenerated) {
      throw new ApiError(500, "OTP generation failed");
    }

    await user.save();

    user.password = undefined;
    user.otp=undefined;
    user.otpExpiry=undefined; // Remove password from response

    return res
      .cookie("user",user._id,{httpOnly:true,sameSite:"None",secure:true,maxAge:24*60*60*1000})
      .status(201)
      .json(new ApiResponse(201, { user }, "User created successfully. Please verify your email with the OTP sent."));
  } catch (error) {
    // If there's an error, make sure to delete the user if it was partially created
    if (user._id) {
      await User.findByIdAndDelete(user._id);
    }
    return next(new ApiError(500, "User creation failed"));
  }
});

export const verifyOtp = asyncHandler(async (req, res, next) => {
  const { otp } = req.body;
  console.log("otp is ",otp);
  const userId = req.cookies.user;
  console.log("userId is ",userId);

  if(!otp || !userId) {
    return next(new ApiError(400, "Please provide OTP and userId"));
  }

  const user = await User.findById(userId);
  console.log("user is",user);

  if(!user) {
    return next(new ApiError(404, "User not found"));
  }

  if(user.otp === otp && user.otpExpiry < Date.now()) {
    console.log("Invalid OTP or OTP expired");
    return next(new ApiError(400, "Invalid OTP or OTP expired"));
  } else if ( user.otp !== otp ) { 
    console.log("Invalid OTP");
    return next(new ApiError(400, "Invalid OTP"));
  }

  user.isOtpVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  return res
  .status(200)
  .json(new ApiResponse(200, null, "OTP verified successfully"));
});

// Google OAuth Login
const googleAuth = passport.authenticate("google", { scope: ["profile", "email"] });

// Google OAuth Callback
const googleCallback = (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err || !user) {
      return res.redirect("https://www.genailearning.in/auth/failed");
    }

    try {
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      return res
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "None",
          secure: true,
          maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
        })
        .redirect("https://www.genailearning.in/dash-admin/tests");
    } catch (error) {
      console.error('Error signing token:', error);
      return res.redirect("https://www.genailearning.in/auth/failed");
    }
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
      .redirect("https://www.genailearning.in/dash-admin/tests");
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

const getUserData = asyncHandler(async (req, res, next) => {
  const id = req.user._id;
  if(!id) {
    return next(new ApiError(400, "Please provide user id"));
  }
  const user = await User.findById(id);
  if(!user) {
    return next(new ApiError(404, "User not found"));
  }

  return res
  .status(200)
  .json(new ApiResponse(200, {user}, "User fetched successfully"));
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

const getAllUsers = asyncHandler(async (req, res) => {
      // Fetch all users from the database, selecting only the necessary fields
      const users = await User.find({}, 'name email role createdAt updatedAt');

      if (!users.length) {
          return res.status(404).json(new ApiError(404, "No users found"));
      }

      // Get the count of users
      const count = await User.countDocuments();

      // Send the response with user data and count
      return res
      .status(200)
      .json(new ApiResponse(200, { users, count }, "All users fetched successfully"));
});


const deleteUser = asyncHandler(async (req, res) => {
  // Find the user by id and delete
  const id = req.params.id;
  console.log("id is ",id);
  if(!id) {
      return res.status(400).json(new ApiError(400, "Please provide user id"));
  }
  const user = await User.findByIdAndDelete(id);

  if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
  }

  // Send the response with the deleted user data
  return res
  .status(200)
  .json(new ApiResponse(200, user, "User deleted successfully"));
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
  updateProfile,
  getAllUsers,
  deleteUser,
  getUserData,
};
