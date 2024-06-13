import mongoose from "mongoose"

const otpSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true
    },
    otp : {
        type : Number,
        required : true
    },
    expireIn : {
        type : Date,
        default : Date.now() + 3600000,
        expires: 3600000
    }
})

export const OTP = mongoose.model("OTP",otpSchema)