import mongoose from "mongoose"


const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    comment: {
        type: String,
        required: true
    }
}, { timestamps: true })

const castSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    roleType: {
        type: String,
        enum: ["cast", "voiceActor"],
        required: true
    }
})

const movieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    releaseYear: {
        type: Number,
        requried: true
    },
    rating: {
        type: Number,
        required: true,
        default: 0
    },
    cast: [castSchema],
    duration: {
        type: Number,
        required: true
    },
    genre: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre"
    }],
    language: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["movie", "series"],
        required: true
    },
    reviews: [reviewSchema]
}, { timestamps: true })


export const Movie = mongoose.model("Movie", movieSchema)