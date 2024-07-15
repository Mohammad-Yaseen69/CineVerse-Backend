import dotenv from "dotenv"
import { connectDB } from "./db/index.js"
import app from './app.js'

dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server running on port ${process.env.PORT}`)
        }).on('error', (err) => {
            console.error('Server failed to start:', err);
        });
    }).catch(err => {
        console.log(err)
    })