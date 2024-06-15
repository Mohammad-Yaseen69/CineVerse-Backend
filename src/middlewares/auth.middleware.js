import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/AsyncHandler.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "");


    if (!token) {
        throw new ApiError(400, "Unauthorized request")
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY)

    const user = await User.findById(decodedToken?.id).select("-password -refreshToken")

    if (!user) {
        throw new ApiError(400, "User not found")
    }


    
    req.expiresIn = decodedToken.exp
    req.user = user

    next()
})
