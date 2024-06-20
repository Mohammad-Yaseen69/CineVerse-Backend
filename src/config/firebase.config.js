import serviceAccount from "./cineverse-106-firebase-adminsdk-82lua-4e0c284185.json"
import admin from "firebase-admin"


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://cineverse-106.appspot.com"
})


const bucket = admin.storage().bucket()


export { bucket }