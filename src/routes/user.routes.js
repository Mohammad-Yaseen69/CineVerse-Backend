import { Router } from "express"
import {
    createUser,
    loginUser,
    logoutUser,
    getCurrentUser, getAllUser,
    resetPassword,
    forgotPassword,
    refreshAccessToken,
    verifyOTP,
    verification
} from "../controllers/user.controller.js"
import { verifyJWT } from '../middlewares/auth.middleware.js'


const router = Router()

router.post('/', createUser).get('/', verifyJWT, getCurrentUser)
router.post('/login', loginUser)
router.get('/:userId/verify/:token', verification)
router.post('/forgot-password', forgotPassword)
router.put('/reset-password', resetPassword)
router.post('/verify-otp', verifyOTP)
// Protected Routes
router.post('/logout', verifyJWT, logoutUser)
router.get('/all', verifyJWT, getAllUser)
router.post('/refresh-token', verifyJWT, refreshAccessToken)

export default router