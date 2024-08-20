import {
    createResult,
    getAllResults,
    getResult
} from '../controllers/results.controller.js'
import { authenticateUser } from '../middleware/auth.middleware.js'
import { isAdmin } from '../middleware/isAdmin.middleware.js'
import { Router } from 'express'

const router = Router()

router.post('/',authenticateUser,createResult)
router.get('/',authenticateUser, getResult)
router.get('/all-results',authenticateUser, isAdmin, getAllResults)

export default router;