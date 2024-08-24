import { getrazorpaykey, checkout, paymentVerification, isElgibleForTest, getAllPayments } from '../controllers/payment.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { Router } from 'express'
import { isAdmin } from '../middleware/isAdmin.middleware.js';

const router = Router()

router.get('/getrazorpaykey', authenticateUser, getrazorpaykey)
router.post('/checkout', authenticateUser, checkout)
router.post('/verify',authenticateUser, paymentVerification)
router.post('/is-elgiblefor-test', authenticateUser, isElgibleForTest)
router.get('/all-payments', authenticateUser, isAdmin, getAllPayments)

export default router;