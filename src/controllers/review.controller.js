import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Media } from "../models/media.models.js";
import { Review } from "../models/review.models.js";

const addReview = asyncHandler(async (req, res, next) => {
    const { review } = req.body;
    const { id } = req.params;
    const user = req.user

    const media = await Media.findById(id);

    if (!media) {
        throw new ApiError(400, "Media not found");
    }

    if (!review) {
        throw new ApiError(400, "Review is required");
    }


    const newReview = await Review.create({
        user: user._id,
        media: media._id,
        review
    })


    res.status(200).json(
        new ApiResponse(200, {
            review: newReview
        }, "Review Added Successfully")
    )
})

const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const user = req.user;

    if (!reviewId) {
        throw new ApiError(400, "Review Id is required");
    }

    const review = await Review.findById(reviewId);

    if(!review){
        throw new ApiError(404, "Review not found")
    }

    if (review.user.toString() !== user._id.toString()) {
        throw new ApiError(401, "You are not authorized to delete this review");
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json(
        new ApiResponse(200, null, "Review Deleted Successfully")
    )
})

const toggleLike = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const user = req.user;
    let message = ""
    if (!reviewId) {
        throw new ApiError(400, "Review Id is required");
    }

    const review = await Review.findById(reviewId);

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    if (review.likes.some(like => like.user.toString() == user._id.toString())) {
        console.log("here")
        review.likes = review.likes?.filter((like) => like.user.toString() !== user._id.toString());
        message = "Unliked"
    }
    else {
        review.likes.push({ user: user._id });
        review.dislikes = review.dislikes.filter((dislike) => dislike?.user.toString() !== user._id.toString())
        message = "Liked"
    }

    await review.save();

    res.status(200).json(
        new ApiResponse(200, null, message)
    )
})

const toggleDislike = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const user = req.user;
    let message = ""

    if (!reviewId) {
        throw new ApiError(400, "Review Id is required");
    }

    const review = await Review.findById(reviewId);

    if (review.dislikes.some(dislike => dislike.user.toString() == user._id.toString())) {
        review.dislikes = review.dislikes?.filter((dislike) => dislike?.user.toString() !== user._id.toString())
        message = "Dislike Removed"
    }
    else {
        review.dislikes.push({ user: user._id })
        review.likes = review.likes.filter((like) => like?.user.toString() !== user._id.toString())
        message = "Dislike Added"
    }


    await review.save()

    res.status(200).json(
        new ApiResponse(200, null, message)
    )
})


const listRecentReviews = asyncHandler(async (req, res) => {
    const user = req.user

    if (!user.isAdmin) {
        throw new ApiError(403, "You are not the admin")
    }

    const reviews = await Review.aggregate([
        {
            $lookup: {
                from: "media",
                localField: "media",
                foreignField: "_id",
                as: "media",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$media"
        },
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
            }
        },
        {
            $unwind: "$user"
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $limit: 10
        },
        {
            $project: {
                _id: 1,
                review: 1,
                media: 1,
                user: 1
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, reviews, "Recent Reviews")
    )
})

const editReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { review } = req.body;
    const user = req.user;

    if (!reviewId) {
        throw new ApiError(400, "Review Id is required");
    }

    if (!review) {
        throw new ApiError(400, "Review is required");
    }

    const reviewDoc = await Review.findById(reviewId);

    if (reviewDoc.user.toString() !== user._id.toString()) {
        throw new ApiError(401, "You are not authorized to edit this review");
    }

    const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { review },
        { new: true }
    );


    res.status(200).json(
        new ApiResponse(200, updatedReview, "Review Updated Successfully")
    )
})

export {
    addReview,
    deleteReview,
    toggleDislike,
    toggleLike,
    listRecentReviews,
    editReview
}