import express from "express";
import { 
    createUser, loginUser, googleAuth, googleCallback, linkedinAuth, linkedinCallback, logoutUser,
    requestPasswordReset, resetPassword, updatePassword, updateProfile
} from "../controllers/user.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
const router = express.Router();

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
