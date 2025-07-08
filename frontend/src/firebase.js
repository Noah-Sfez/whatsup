// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBasp8tn6VvkPtfPY_nDtVxtCiB5jExa_RI',
  authDomain: 'whatsapp-8cad8.firebaseapp.com',
  projectId: 'whatsapp-8cad8',
  storageBucket: 'whatsapp-8cad8.appspot.com',
  messagingSenderId: '474256150275',
  appId: '1:474256150275:web:7ac9e103ba5552c9fb6336',
  measurementId: 'G-6G7W203YFZ',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }
