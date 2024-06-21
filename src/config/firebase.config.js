import admin from "firebase-admin"
import {createRequire} from "module"
const require = createRequire(import.meta.url);
const serviceAccount = require('./cineverse-106-firebase-adminsdk-82lua-4e0c284185.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://cineverse-106.appspot.com"
})


const bucket = admin.storage().bucket()


export { bucket }