import { User } from "../models/user.model.js";
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/AsyncHandler.js'
import { sendEmail } from '../utils/sendEmail.js'
import { Token } from '../models/token.models.js'
import { OTP } from '../models/otp.models.js'
import { generateOTP } from "../utils/generateOTP.js";
import crypto from 'crypto'
import jwt from "jsonwebtoken"

const options = {
    httpOnly: true,
    secure: true,
}

const createAccess_RefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = await user.generateRefreshToken()
        const acccessToken = await user.generateAccessToken()

        user.refreshToken = refreshToken;

        await user.save({
            validateBeforeSave: false
        })

        return {
            acccessToken,
            refreshToken
        }
    } catch (error) {
        console.log(error)
    }
}


const createUser = asyncHandler(async (req, res) => {
    const { name, password, email } = req.body;

    if (!name || !password || !email) {
        throw new ApiError(400, "Please provide all the details")
    }

    if (!email.includes("@")) {
        throw new ApiError(400, "Invalid email")
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters")
    }

    const existedUser = await User.findOne({ email })

    if (existedUser) {
        throw new ApiError(400, "User already exists")
    }

    const user = await User.create({ name, password, email });

    const token = await Token.create({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex")
    })

    const url = `${process.env.BASE_URL}users/${user._id}/verify/${token.token}`

    await sendEmail(user.email, "Verify Email", url)

    if (!user) {
        throw new ApiError(400, "User not created")
    }

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200, createdUser, "User Created Successfully and An Email Send to your account please verify")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Please provide all the details")
    }
    let isVerified = true

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    if (!user.verified) {
        let token = await Token.findOne({ userId: user._id })
        if (!token) {
            token = await Token.create({ userId: user._id, token: crypto.randomBytes(32).toString("hex") })
            const url = `${process.env.BASE_URL}users/${user._id}/verify/${token.token}`
            await sendEmail(user.email, "Verify Email", url)
        }

        isVerified = false
    }


    const isPasswordCorrect = await user.checkPassword(password)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid credentials")
    }


    const { acccessToken, refreshToken } = await createAccess_RefreshToken(user._id)

    if (!acccessToken || !refreshToken) {
        throw new ApiError(400, "Access token and refresh token not created")
    }


    res.status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", acccessToken, options)
        .json(
            new ApiResponse(200, user, `User logged in successfully${isVerified ? "" : " and Please verify your email,"}`)
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    const user = req.user?._id;

    await User.findByIdAndUpdate(user._id, {
        $unset: { refreshToken: "" }
    })

    res.status(200)
        .clearCookie("refreshToken")
        .clearCookie("accessToken")
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const storedToken = req.cookies?.refreshToken || req.headers?.authorization?.replace("Bearer ", "");

    if (!storedToken) {
        throw new ApiError(400, "Refresh Token is required")
    }

    const decodedToken = jwt.verify(storedToken, process.env.REFRESH_TOKEN_KEY)

    const user = await User.findById(decodedToken.id)

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    if (user.refreshToken !== storedToken) {
        throw new ApiError(400, "Invalid refresh token")
    }

    const { acccessToken, refreshToken } = await createAccess_RefreshToken(user?._id)

    res.status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", acccessToken, options)
        .json(
            new ApiResponse(200, user, "Access token refreshed successfully")
        )
})

const getAllUser = asyncHandler(async (req, res) => {
    const users = await User.find()

    res.status(200).json(
        new ApiResponse(200, users, "Users fetched successfully")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;

    res.status(200).json(
        new ApiResponse(200, { user, expiresIn: req.expiresIn }, "User fetched successfully")
    )
})

const verification = asyncHandler(async (req, res) => {
    const { userId, token } = req.params;


    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    const tokenFound = await Token.findOne({ userId: user._id, token })

    if (!tokenFound) {
        throw new ApiError(400, "Invalid token")
    }

    user.verified = true;

    await user.save()

    await tokenFound.deleteOne()

    res.status(200).json(
        new ApiResponse(200, {}, "User verified successfully")
    )
})

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;


    if (!email) {
        throw new ApiError(400, "Please provide your email address")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(400, "Invalid Email")
    }

    if (!user?.verified) {
        throw new ApiError(400, "Email not verified")
    }


    const otpExist = await OTP.findOne({ email })

    if (otpExist) {
        await otpExist.deleteOne()
    }

    const otp = generateOTP()

    await OTP.create({ email, otp })

    await sendEmail(email, "OTP", "", `
    <p style="font-family: Arial, sans-serif;">Dear User,</p>
    <p style="font-family: Arial, sans-serif;">Use the following OTP to complete your process:</p>
    <p style="font-size: 24px; font-weight: bold; color: #333;">${otp}</p>
    <p style="font-family: Arial, sans-serif;">This OTP will expire in <span style="color: #ff0000; font-weight: bold;">1 hour</span>.</p>`
    )


    res.status(200).json(
        new ApiResponse(200, { email }, "OTP send successfully")
    )
})

const verifyOTP = asyncHandler(async (req, res) => {
    const { otp } = req.body;

    if (!otp) {
        throw new ApiError(400, "Please provide OTP")
    }

    const otpExist = await OTP.findOne({ otp })



    if (!otpExist) {
        throw new ApiError(400, "OTP not found")
    }

    if (otpExist.expireIn < Date.now()) {
        throw new ApiError(400, "OTP expired")
    }

    if (otpExist.otp !== parseInt(otp)) {
        throw new ApiError(400, "Invalid OTP!")
    }
    const user = await User.findOne({ email: otpExist.email })

    user.otpVerified = true

    await user.save()

    await otpExist.deleteOne()

    res.status(200).json(
        new ApiResponse(200, {}, "OTP verified successfully")
    )
})

const resetPassword = asyncHandler(async (req, res) => {
    const { newPassword , email } = req.body;
    
    const user = await User.findOne({ email })

    if (!newPassword) {
        throw new ApiError(400, "Please provide new password")
    }

    if (!user.otpVerified) {
        throw new ApiError(400, "Please verify OTP")
    }


    user.password = newPassword

    await User.findByIdAndUpdate(user._id, {
        $unset: { otpVerified: "" }
    })

    await user.save()


    res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully")
    )
})




export {
    createUser,
    loginUser,
    logoutUser,
    getAllUser,
    getCurrentUser,
    verification,
    forgotPassword,
    refreshAccessToken,
    resetPassword,
    verifyOTP
}