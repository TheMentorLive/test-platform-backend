import {
    createTest,
    getAllTests,
    getTest,
    getNEETTests,
    getJEETests
} from '../controllers/test.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/isAdmin.middleware.js';
import { Router } from 'express';

const router = Router();

router.post('/create', authenticateUser, isAdmin, createTest);
router.get('/', authenticateUser,  getAllTests);
router.get('/neet', authenticateUser, getNEETTests);
router.get('/jee', authenticateUser, getJEETests);
router.get('/:id', authenticateUser, getTest);

export default router;