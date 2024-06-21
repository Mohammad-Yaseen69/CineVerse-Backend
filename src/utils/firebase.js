import { bucket } from "../config/firebase.config.js";
import fs from "fs"
import { ApiError } from "./ApiError.js";
import Mime from "mime"


const uploadFile = async (localFilePath) => {
    const destination = `Uploads/${localFilePath}`

    const contentType = Mime.getType(localFilePath)

    try {
        await bucket.upload(localFilePath, {
            destination,
            metadata : {
                contentType
            }
        })

        console.log("File upload successfully")

        const file = bucket.file(destination)

        await file.makePublic()

        fs.unlinkSync(localFilePath)
        return file.publicUrl()
        

    } catch (error) {
        console.log(error.message)
        fs.unlinkSync(localFilePath)
    }
}

const deleteFile = async (filePath) => {
    try {
        await bucket.file(filePath).delete()
        console.log("File deleted successfully")
    } catch (error) {
        console.log(error.message)
        throw new ApiError(500, "File deletion failed")
    }
}

export {
    uploadFile,
    deleteFile
}