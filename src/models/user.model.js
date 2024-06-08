import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        lowerCase: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    refreshToken: String
}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.checkPassword = async function (password) {
    try {
        const response = await bcrypt.compare(password, this.password)
        console.log(response, password)
        return response
    } catch (error) {
        console.log(error.message)
    }
}

userSchema.methods.generateAccessToken = async function () {
    jwt.sign(
        {
            name: this.name,
            email: this.email,
            id: this._id
        },
        process.env.ACCESS_TOKEN_KEY,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRE
        }
    )
}

userSchema.methods.generateRefreshToken = async function () {
    jwt.sign(
        { id: this._id },
        process.env.REFRESH_TOKEN_KEY,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE
        }
    )
}


export const User = mongoose.model("User", userSchema)