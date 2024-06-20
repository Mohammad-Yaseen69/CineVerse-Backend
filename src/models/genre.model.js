import mongoose from "mongoose";

const genreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
});


export const Genre = mongoose.model("Genre", genreSchema);