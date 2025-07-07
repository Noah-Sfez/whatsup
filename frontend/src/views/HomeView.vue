<script setup>
import { ref } from 'vue'
// import { db } from './firebase'
// import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";

const message = ref('')
const messages = ref([])

// const sendMessage = async () => {
//   if (!message.value) return
// //   await addDoc(collection(db, "messages"), {
//     content: message.value,
//     createdAt: new Date()
//   })
//   message.value = ""
//   await fetchMessages()
// }

// const fetchMessages = async () => {
//   const q = query(collection(db, "messages"), orderBy("createdAt", "desc"))
//   const snapshot = await getDocs(q)
//   messages.value = snapshot.docs.map(doc => doc.data())
// }

// // Charger les messages au chargement
// fetchMessages()
</script>

<template>
  <div>
    <input v-model="message" placeholder="Ton message..." />
    <button @click="sendMessage">Envoyer</button>
    <ul>
      <li v-for="(msg, i) in messages" :key="i">{{ msg.content }}</li>
    </ul>
  </div>
</template>
