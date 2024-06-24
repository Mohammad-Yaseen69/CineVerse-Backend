import mongoose from "mongoose"
import aggregatePaginate from "mongoose-aggregate-paginate-v2"



const castSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    roleType: {
        type: String,
        enum: ["cast", "voiceActor" , "writer" , "director"],
        required: true
    }
})

const mediaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    img: {
        publicUrl: {
            type: String,
            required: true
        },
        filePath: {
            type: String,
            required: true
        }
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
        type: String,
        required: true
    },
    genre: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre"
    }],
    language: {
        type: [String],
        required: true
    },
    type: {
        type: String,
        enum: ["movie", "series"],
        required: true
    },
}, { timestamps: true })

mediaSchema.plugin(aggregatePaginate)

export const Media = mongoose.model("Media", mediaSchema)