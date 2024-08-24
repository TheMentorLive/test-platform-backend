import {
    getResultBySubmission,
    getResultsByTestId,
    getTestSummary,
} from '../controllers/results.controller.js'
import { authenticateUser } from '../middleware/auth.middleware.js'
import { isAdmin } from '../middleware/isAdmin.middleware.js'
import { Router } from 'express'

const router = Router()

router.post('/:submissionId',authenticateUser, getResultBySubmission)
router.get('/test-result/:testId',authenticateUser, isAdmin, getResultsByTestId)
router.get('/test-summary/:submissionId',authenticateUser, getTestSummary)

export default router;