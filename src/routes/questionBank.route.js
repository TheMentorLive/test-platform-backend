import {
    createQuestion,
    getQuestion,
    getQuestions,
    updateQuestion,
    deleteQuestion
} from "../controllers/questionBank.controller.js"
import { isAdmin } from "../middleware/isAdmin.middleware.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { Router } from "express"

const router = Router();

router.post("/", authenticateUser, isAdmin, createQuestion);
router.get("/", authenticateUser, getQuestions);
router.get("/:id", authenticateUser, getQuestion);
router.put("/:id", authenticateUser, isAdmin, updateQuestion);
router.delete("/:id", authenticateUser, isAdmin, deleteQuestion);





export default router;