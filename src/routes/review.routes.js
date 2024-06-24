import {verifyJWT} from "../middlewares/auth.middleware.js"
import {addReview, deleteReview, listRecentReviews, toggleDislike, toggleLike, editReview} from "../controllers/review.controller.js"
import {Router} from "express"


const router = Router();

router.use(verifyJWT)

router.post("/:id", addReview)
    .get("/", listRecentReviews)
    .patch("/:reviewId", editReview)
    .patch("/:reviewId/like", toggleLike)
    .patch("/:reviewId/dislike", toggleDislike)
    .delete("/:reviewId", deleteReview)

export default router
