import { createGetInTouch } from "../controllers/mislenious.controller.js";
import { Router } from "express";

const router = Router();

router.post("/get-in-touch", createGetInTouch);

export default router;