import express from "express";
import { 
    createUser, loginUser, googleAuth, googleCallback, linkedinAuth, linkedinCallback, logoutUser,
    requestPasswordReset, resetPassword, updatePassword, updateProfile, getAllUsers, deleteUser, getUserData,
    verifyOtp
} from "../controllers/user.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/isAdmin.middleware.js";
const router = express.Router();

router.get("/",authenticateUser, isAdmin, getAllUsers);
router.delete("/:id",authenticateUser, isAdmin, deleteUser);

router.get("/get-details", authenticateUser, getUserData);
router.post("/verify-otp", verifyOtp);

router.post("/signup", createUser);
router.post("/login", loginUser);

router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleCallback);

router.get("/auth/linkedin", linkedinAuth);
router.get("/auth/linkedin/callback", linkedinCallback);

router.post("/logout", authenticateUser, logoutUser);

router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.put("/update-password", authenticateUser, updatePassword);
router.put("/update-profile", authenticateUser, updateProfile);

export default router;
