import { Router } from "express"
import { createUser , loginUser,logoutUser, getCurrentUser, getAllUser ,resetPassword,verification} from "../controllers/user.controller.js"
import {verifyJWT} from '../middlewares/auth.middleware.js'


const router = Router()

router.post('/', createUser).get('/', verifyJWT, getCurrentUser)
router.post('/login', loginUser)
router.get('/:userId/verify/:token' , verification)

// Protected Routes
router.post('/logout' , verifyJWT, logoutUser)


export default router