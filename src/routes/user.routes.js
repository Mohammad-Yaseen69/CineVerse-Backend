import { Router } from "express"
import { createUser , loginUser,logoutUser} from "../controllers/user.controller.js"
import {verifyJWT} from '../middlewares/auth.middleware.js'


const router = Router()

router.post('/', createUser)
router.post('/login', loginUser)

// Protected Routes
router.post('/logout' , verifyJWT, logoutUser)

export default router