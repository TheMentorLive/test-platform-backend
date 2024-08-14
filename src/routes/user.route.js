import express from "express";
import { createUser, loginUser, googleAuth, googleCallback, linkedinAuth, linkedinCallback } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/signup", createUser);
router.post("/login", loginUser);

router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleCallback);

router.get("/auth/linkedin", linkedinAuth);
router.get("/auth/linkedin/callback", linkedinCallback);

export default router;
