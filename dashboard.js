import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔹 CONFIG FIREBASE - COLE SUA CHAVE REAL
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
const db = getFirestore(app);

// ELEMENTOS DO DASHBOARD
const stepsElement = document.getElementById("steps");
const addBtn = document.getElementById("addBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");
const moveRing = document.querySelector(".move");

let currentUser;
let simulatedSteps = 0;

// 🔹 FUNÇÃO ANIMA NÚMERO DE PASSOS
function animateSteps(target) {
  const element = stepsElement;
  let start = parseInt(element.innerText) || 0;
  const duration = 800;
  const startTime = performance.now();

  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const value = Math.floor(start + (target - start) * progress);
    element.innerText = value;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// 🔹 FUNÇÃO ATUALIZA ANEL MOVE
function updateRing(steps) {
  const goal = 10000;
  const percentage = Math.min(steps / goal, 1);
  const degrees = percentage * 360;

  moveRing.style.transition = "background 1s cubic-bezier(.22,1,.36,1)";
  moveRing.style.background = `
    conic-gradient(
      #ff375f 0deg,
      #ff375f ${degrees}deg,
      rgba(255,255,255,0.1) ${degrees}deg,
      rgba(255,255,255,0.1) 360deg
    )
  `;

  // pulse animation
  moveRing.classList.add("pulse");
  setTimeout(() => moveRing.classList.remove("pulse"), 600);
}

// 🔹 AUTH
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    userEmail.innerText = user.email;

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      simulatedSteps = docSnap.data().steps || 0;
    } else {
      simulatedSteps = 0;
      await setDoc(docRef, { steps: 0 });
    }

    animateSteps(simulatedSteps);
    updateRing(simulatedSteps);
  } else {
    window.location.href = "index.html";
  }
});

// 🔹 BOTÃO ADICIONAR PASSOS MANUAL
addBtn.addEventListener("click", async () => {
  const addSteps = parseInt(document.getElementById("addSteps").value);
  if (!addSteps) return;

  simulatedSteps += addSteps;
  animateSteps(simulatedSteps);
  updateRing(simulatedSteps);

  if (currentUser) {
    await setDoc(doc(db, "users", currentUser.uid), { steps: simulatedSteps });
  }
});

// 🔹 LOGOUT
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🔹 SIMULA PASSOS AUTOMÁTICOS
setInterval(async () => {
  const increment = Math.floor(Math.random() * 3); // 0,1,2 passos
  simulatedSteps += increment;
  animateSteps(simulatedSteps);
  updateRing(simulatedSteps);

  if (currentUser) {
    await setDoc(doc(db, "users", currentUser.uid), { steps: simulatedSteps });
  }
}, 1000); // a cada 1 segundo
