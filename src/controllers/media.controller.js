import { asyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFile, deleteFile } from "../utils/firebase.js";
import { Media } from "../models/media.models.js";
import { Genre } from "../models/genre.model.js"
import mongoose from "mongoose";
import fs from "fs"


const validation = ({ name, description, cast, releaseYear, rating, duration, genres, language, type }, user, localPath) => {
    if (!name || !description || !cast || !releaseYear || !rating || !duration || !genres || !language || !type) {
        localPath && fs.unlinkSync(localPath)
        throw new ApiError(400, "All fields are required")
    }

    if (!user.isAdmin) {
        localPath && fs.unlinkSync(localPath)
        throw new ApiError(403, "You are not the admin")
    }

    if (!["movie", "series"].includes(type)) {
        localPath && fs.unlinkSync(localPath)
        throw new ApiError(400, "Invalid media type. Must be 'movie' or 'series'.");
    }



    if (!Array.isArray(cast)) {
        localPath && fs.unlinkSync(localPath)
        throw new ApiError(400, "Cast must be an array")
    }

    if (!Array.isArray(genres)) {
        localPath && fs.unlinkSync(localPath)
        throw new ApiError(400, "Genres must be an array")
    }

    if (!Array.isArray(language)) {
        localPath && fs.unlinkSync(localPath)
        throw new ApiError(400, "Language must be an array")
    }



    for (const castObj of cast) {
        if (!castObj.name || !castObj.roleType) {
            localPath && fs.unlinkSync(localPath)
            throw new ApiError(400, "Each Cast object must have name and role")
        }


        if (!["cast", "voiceActor", "writer", "director"].includes(castObj.roleType)) {
            localPath && fs.unlinkSync(localPath)
            throw new ApiError(400, "Invalid role type. Must be 'cast', 'voiceActor', 'writer' or 'director'.")
        }
    }
}


const createMedia = asyncHandler(async (req, res) => {
    const { name, description, cast, releaseYear, rating, duration, genres, language, type } = req.body
    const user = req?.user
    const imgLocalPath = req?.file?.path

    let parsedObject = {}

    if (cast && language && genres) {
        parsedObject.cast = JSON.parse(cast)
        parsedObject.language = JSON.parse(language)
        parsedObject.genres = JSON.parse(genres)
    }


    if (!imgLocalPath) {
        throw new ApiError(400, "Image is required")
    }

    validation({
        ...req.body,
        ...parsedObject
    }, user, imgLocalPath)

    // Check if genre exists

    let genresIds = []

    

    for (const genreName of JSON.parse(genres)) {
        const genre = await Genre.findOne({ name: genreName })

        if (!genre) {
            throw new ApiError(400, `Genre ${genreName} does not exist`)
        }

        genresIds.push(genre._id)
    }

    parsedObject.genre = genresIds

    console.log(parsedObject)

    const imgFirebaseUrl = await uploadFile(imgLocalPath)


    if (!imgFirebaseUrl) {
        throw new ApiError(500, "File upload failed Please Try again")
    }

    const imgObj = {
        publicUrl: imgFirebaseUrl,
        filePath: `Uploads/${imgLocalPath}`
    }

    const newMedia = await Media.create({
        name,
        description,
        releaseYear: Number(releaseYear),
        rating: Number(rating),
        duration: type === "movie" ? duration : duration + " per EP",
        type,
        img: imgObj,
        ...parsedObject
    })

    if (!newMedia) {
        await deleteFile(imgObj.filePath)
        throw new ApiError(500, "Something went wrong while creating the media")
    }


    res.status(200).json(
        new ApiResponse(200, newMedia, "Media Created Successfully")
    )
})


const deleteMedia = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = req?.user

    if (!user.isAdmin) {
        throw new ApiError(403, "You are not the admin")
    }

    const media = await Media.findById(id)

    if (!media) {
        throw new ApiError(404, "Media not found")
    }

    await deleteFile(media.img.filePath)

    await Media.findByIdAndDelete(id)

    return res.status(200).json(
        new ApiResponse(200, null, "Media Deleted Successfully")
    )
})

const getMedia = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const aggregate = await Media.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: "genres",
                localField: "genre",
                foreignField: "_id",
                as: "genre",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            name: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                genre: "$genre.name"
            }
        },
        {
            $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "media",
                as: "reviews",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "user",
                            foreignField: "_id",
                            as: "user",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 0,
                                        userName: 1
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $unwind: "$user"
                    },
                    {
                        $addFields: {
                            likes: {
                                $size: "$likes"
                            },
                            dislikes: {
                                $size: "$dislikes"
                            }
                        }
                    },
                ]
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                cast: 1,
                releaseYear: 1,
                rating: 1,
                duration: 1,
                genre: 1,
                language: 1,
                type: 1,
                img: {
                    publicUrl: 1
                },
            }
        }
    ])

    if (!aggregate.length) {
        throw new ApiError(404, "Media not found")
    }

    return res.status(200).json(
        new ApiResponse(200, aggregate[0], "Media Fetched Successfully")
    )
})

const editMedia = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, cast, releaseYear, rating, duration, genres, language, type } = req.body
    const user = req?.user
    const file = req?.file

    let parsedObject = {}

    if (cast && language && genres) {
        parsedObject.cast = JSON.parse(cast)
        parsedObject.language = JSON.parse(language)
        parsedObject.genres = JSON.parse(genres)
    }


    validation({
        ...req.body,
        ...parsedObject
    }, user, file?.path)

    const media = await Media.findById(id)

    if (!media) {
        throw new ApiError(404, "Media not found")
    }

    let genresIds = []

    for (const genreName of JSON.parse(genres)) {
        const genre = await Genre.findOne({ name: genreName })

        if (!genre) {
            throw new ApiError(400, `Genre ${genreName} does not exist`)
        }

        genresIds.push(genre._id)
    }

    parsedObject.genre = genresIds

    let img = {}

    if (file) {
        await deleteFile(media.img.filePath);
        const imgLocalPath = req?.file?.path;

        const fileUpload = await uploadFile(imgLocalPath);

        if (!fileUpload) {
            throw new ApiError(500, "File upload failed Please Try again")
        }

        img = {
            publicUrl: fileUpload,
            filePath: `Uploads/${imgLocalPath}`
        }
    }

    const updatedMedia = await Media.findByIdAndUpdate(
        id,
        {
            name,
            description,
            releaseYear: Number(releaseYear),
            rating: Number(rating),
            img: file ? img : media.img,
            duration: type === "movie" ? duration : duration + " per EP",
            type,
            ...parsedObject,
        },
        { new: true }
    )

    return res.status(200).json(
        new ApiResponse(200, updatedMedia, "Media Updated Successfully")
    )
})

const getAllMedia = asyncHandler(async (req, res) => {
    const aggregate = await Media.aggregate([
        {
            $lookup: {
                from: "genres",
                localField: "genre",
                foreignField: "_id",
                as: "genres",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            name: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                genres: "$genres.name"
            }
        },
        {
            $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "media",
                as: "reviews"
            }
        },
        {
            $addFields: {
                reviews : {
                    $size : "$reviews"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                cast: 1,
                releaseYear: 1,
                rating: 1,
                duration: 1,
                genres: 1,
                language: 1,
                type: 1,
                img: {
                    publicUrl: 1
                },
                reviews: 1,
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, aggregate, "All Media Fetched Successfully")
    )
})

const searchMedia = asyncHandler(async (req, res) => {
    const { sortType, page = 1, limit = 10, query, genres = [], releaseYear, sortBy } = req.query;


    let pipeline = [];

    if (query) {
        pipeline.push({
            $search: {
                index: "searchMedia",
                text: {
                    query: query,
                    path: ["name"]
                }
            }
        });
    }

    // Handle genres filter
    if (genres.length > 0) {
        let genresIds = [];

        for (const genreName of genres) {
            const genre = await Genre.findOne({ name: genreName });

            if (!genre) {
                throw new ApiError(400, `Genre ${genreName} does not exist`);
            }

            genresIds.push(genre._id);
        }

        pipeline.push({
            $match: {
                genre: { $in: genresIds }
            }
        });
    }

    // Handle release year filter
    if (releaseYear) {
        pipeline.push({
            $match: {
                releaseYear: Number(releaseYear)
            }
        });
    }

    // Handle rating sorting
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({
            $sort: {
                [sortBy]: -1
            }
        });
    }

    // Handle search query


    try {
        // Perform aggregation
        const aggregate = Media.aggregate(pipeline);

        // Pagination options
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };

        // Aggregate paginate
        const medias = await Media.aggregatePaginate(aggregate, options);

        res.status(200).json(
            new ApiResponse(200, medias, "Media Fetched Successfully")
        );
    } catch (err) {
        res.status(500).json(
            new ApiResponse(500, null, "An error occurred while fetching media")
        );
    }
});


export {
    createMedia,
    deleteMedia,
    getMedia,
    editMedia,
    getAllMedia,
    searchMedia,
}