import { asyncHandler } from "../utils/AsyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { Genre } from "../models/genre.model.js"


const createGenre = asyncHandler(async (req, res) => {
    const { name } = req.body
    const user = await User.findById(req.user._id)

    if (!user.isAdmin) {
        throw new ApiError(400, "You are not the admin")
    }

    if (!name) {
        throw new ApiError(400, "Please Provide a name for genre")
    }

    const alreadyExisted = await Genre.findOne({ name })

    if (alreadyExisted) {
        throw new ApiError("Genre already existed")
    }

    const genre = await Genre.create({ name })

    res.status(201).json(
        new ApiResponse(201, genre, "Genre Created Successfully")
    )
})

const deleteGenre = asyncHandler(async (req, res) => {
    const { id } = req.params
    const user = await User.findById(req.user._id)

    if (!user.isAdmin) {
        throw new ApiError(400, "You are not the admin")
    }

    const genre = await Genre.findById(id)

    if (!genre) {
        throw new ApiError(404, "Genre not found")
    }

    await Genre.findByIdAndDelete(id)

    res.status(200).json(
        new ApiResponse(200, null, "Genre Deleted Successfully")
    )
})

const getAllGenre = asyncHandler(async (req, res) => {
    const user = req?.user

    if (!user?.isAdmin) {
        throw new ApiError(400, "You are not the admin")
    }

    const aggregate = await Genre.aggregate([
        {
            $group: {
                _id: null,
                genres: {
                    $push: "$name"
                }
            },
        },
        {
            $project: {
                _id: 0,
                genres: 1
            }
        }
    ])

    res.status(200).json(
        new ApiResponse(200, aggregate, "Genres Fetched Successfully")
    )
})

const getGenreByName = asyncHandler(async (req, res) => {
    const { name } = req.params

    const genre = await Genre.findOne({ name })

    if (!genre) {
        throw new ApiError(404, "Genre not found")
    }

    res.status(200).json(
        new ApiResponse(200, genre, "Genre Fetched Successfully")
    )
})

export { createGenre, deleteGenre , getAllGenre, getGenreByName}