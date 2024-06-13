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

// Protected Routes
router.post('/logout', verifyJWT, logoutUser)
router.get('/all', verifyJWT, getAllUser)
router.post('/forgot-password', verifyJWT, forgotPassword)
router.post('/refresh-token', verifyJWT, refreshAccessToken)
router.put('/reset-password', verifyJWT, resetPassword)
router.post('/verify-otp', verifyJWT, verifyOTP)



export default router