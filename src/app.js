import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(cookieParser())
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    exposedHeaders: ['Set-Cookie'],
}))



// Routing

import userRoute from './routes/user.routes.js'
import genreRoute from "./routes/genre.routes.js"
import mediaRoute from "./routes/media.routes.js"
import reviewRoute from "./routes/review.routes.js"



app.use("/api/v1/users" , userRoute)
app.use("/api/v1/genres", genreRoute)
app.use("/api/v1/media", mediaRoute)
app.use("/api/v1/reviews", reviewRoute)

export default app