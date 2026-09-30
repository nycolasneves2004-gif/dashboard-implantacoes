import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDODHtXWZ_kj50X_EWowuOv5c46rJCv_qY",
  authDomain: "dashboard-implantacoes.firebaseapp.com",
  projectId: "dashboard-implantacoes",
  storageBucket: "dashboard-implantacoes.firebasestorage.app",
  messagingSenderId: "144347897858",
  appId: "1:144347897858:web:e6315afc1a3cd71f7a071b",
  measurementId: "G-FW466DKG5Z"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)