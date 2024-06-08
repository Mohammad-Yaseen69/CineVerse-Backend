import { User } from "../models/user.model.js";
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/AsyncHandler.js'



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

    if (!user) {
        throw new ApiError(400, "User not created")
    }

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200, createdUser, "User Created Successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Please provide all the details")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(400, "User not found")
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
            new ApiResponse(200, user, "User logged in successfully")
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    const user = req.user?._id;

    await User.findByIdAndUpdate(user._id , {
        $unset: {refreshToken : ""}
    })

    res.status(200)
    .clearCookie("refreshToken")
    .clearCookie("accessToken")
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )
})


export { createUser, loginUser ,logoutUser}