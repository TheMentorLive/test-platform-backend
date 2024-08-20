import {
    createSubmission,
    getAllSubmissions,
    getSubmission } from "../controllers/submission.controller.js"

import { authenticateUser } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/isAdmin.middleware.js";

import { Router } from "express"

const router = Router();

router.get('/:id',authenticateUser ,getSubmission)
router.get('/all-submissions',authenticateUser, isAdmin,getAllSubmissions)
router.post('/',authenticateUser,createSubmission)


export default router;