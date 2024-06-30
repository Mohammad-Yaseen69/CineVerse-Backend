import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { createGenre, deleteGenre, getAllGenre, getGenreByName } from "../controllers/genre.controller.js";

const router = Router()


router.post("/", verifyJWT, createGenre)
    .delete("/:id", verifyJWT, deleteGenre)
    .get("/", getAllGenre)
    .get("/:name", getGenreByName)

export default router