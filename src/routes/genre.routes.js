import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { createGenre, deleteGenre } from "../controllers/genre.controller.js";

const router = Router()

router.use(verifyJWT)

router.post("/", createGenre).delete("/:id", deleteGenre)

export default router