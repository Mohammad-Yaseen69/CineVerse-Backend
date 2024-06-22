import mongoose from "mongoose"


const likeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

const dislikeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    comment: {
        type: String,
        required: true
    },
    likes: [likeSchema],
    dislikes: [dislikeSchema]
}, { timestamps: true })

export const Review = mongoose.model("Review", reviewSchema)
