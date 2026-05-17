import { initializeApp } from "firebase/app"

import {
  getFirestore
} from "firebase/firestore"

import {
  getAuth
} from "firebase/auth"


const firebaseConfig = {

  apiKey: "AIzaSyA1US56-eOd8jNdWyIoJ_rOiGzCY6TSWkA",

  authDomain: "tracktogether-6d840.firebaseapp.com",

  projectId: "tracktogether-6d840",

  storageBucket: "tracktogether-6d840.firebasestorage.app",

  messagingSenderId: "1001190578227",

  appId: "1:1001190578227:web:3d27ec5a789e98f1f06b46",

  measurementId: "G-D6SXR5FYSG"
}


const app = initializeApp(firebaseConfig)

const db = getFirestore(app)

const auth = getAuth(app)

export { db, auth }