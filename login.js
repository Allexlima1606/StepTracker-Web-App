import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAq1YoafXvWAjabGleIe3heV0xkWkq8mK0",
  authDomain: "steptracker-pro.firebaseapp.com",
  projectId: "steptracker-pro",
  storageBucket: "steptracker-pro.firebasestorage.app",
  messagingSenderId: "841144123231",
  appId: "1:841144123231:web:1f39a410372b627a3a80ea",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});

const form = document.getElementById("authForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "dashboard.html";
      } catch (err) {
        message.innerText = "Senha incorreta ❌";
      }
    } else {
      message.innerText = error.message;
    }
  }
});
