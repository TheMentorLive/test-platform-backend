import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide a name"]
    },
    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    password: {
        type: String,
    },
    googleId: {
        type: String,
    },
    linkedinId: {
        type: String,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordTokenExpiry: {
        type: Date,
    },
    otp:{
        type: String
    },
    otpExpiry:{
        type: Date
    },
    isOtpVerified:{
        type: Boolean,
        default: false
    },
},{ timestamps:true });

// Hash the password before saving the user

userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare user password

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password);
}

export const User = mongoose.model("User", userSchema);

