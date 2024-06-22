import { Router } from "express";
import { createMedia, deleteMedia, editMedia, getAllMedia, getMedia, searchMedia } from "../controllers/media.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();





router.get("/search", searchMedia)

router.post("/", verifyJWT, upload.single("img"), createMedia)
    .get("/", getAllMedia)

router.get("/:id", getMedia)
    .patch("/:id", verifyJWT, upload.single("img"), editMedia)
    .delete("/:id", verifyJWT, deleteMedia)

export default router;