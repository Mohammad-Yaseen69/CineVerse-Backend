import { asyncHandler } from "../utils/AsyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { Genre } from "../models/genre.model.js"


const createGenre = asyncHandler(async (req, res) => {
    const { name } = req.body
    const user = await User.findById(req.user._id)

    if (!user.isAdmin) {
        throw new ApiError("You are not the admin")
    }

    if (!name) {
        throw new ApiError("Please Provide a name for genre")
    }

    const alreadyExisted = await Genre.findOne({ name })

    if (alreadyExisted) {
        throw new ApiError("Genre already existed")
    }

    await Genre.create({ name })

    res.status(201).json(
        new ApiResponse(201, null, "Genre Created Successfully")
    )
})

const deleteGenre = asyncHandler(async (req, res) => {
    const { id } = req.params
    const user = await User.findById(req.user._id)

    if (!user.isAdmin) {
        throw new ApiError("You are not the admin")
    }

    const genre = await Genre.findById(id)

    if (!genre) {
        throw new ApiError("Genre not found")
    }

    await Genre.findByIdAndDelete(id)

    res.status(200).json(
        new ApiResponse(200, null, "Genre Deleted Successfully")
    )
})


export {createGenre , deleteGenre}