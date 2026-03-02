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

// FIREBASE CONFIG
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

// ELEMENTOS
const stepsElement = document.getElementById("steps");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");
const moveRing = document.querySelector(".move");
const exerciseRing = document.getElementById("exerciseRing");
const standRing = document.getElementById("standRing");

let currentUser;
let simulatedSteps = 0;
let simulatedExercise = 0;
let simulatedStand = 0;
let weeklyData = Array(7).fill(0); // histórico semanal

// DARK/LIGHT AUTOMÁTICO
function setTheme() {
  const hour = new Date().getHours();
  document.body.classList.toggle("dark", hour >= 19 || hour < 6);
  document.body.classList.toggle("light", hour >= 6 && hour < 19);
}
setTheme();

// ANIMA PASSOS
function animateSteps(target) {
  const element = stepsElement;
  let start = parseInt(element.innerText) || 0;
  const duration = 800;
  const startTime = performance.now();
  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    element.innerText = Math.floor(start + (target - start) * progress);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ATUALIZA ANÉIS
function updateRing(steps, exercise, stand) {
  moveRing.style.background = `conic-gradient(#ff375f 0deg, #ff375f ${Math.min((steps / 10000) * 360, 360)}deg, rgba(255,255,255,0.1) 0deg 360deg)`;
  exerciseRing.parentElement.style.background = `conic-gradient(#32d74b 0deg, #32d74b ${Math.min((exercise / 60) * 360, 360)}deg, rgba(255,255,255,0.1) 0deg 360deg)`;
  standRing.parentElement.style.background = `conic-gradient(#0a84ff 0deg, #0a84ff ${Math.min((stand / 12) * 360, 360)}deg, rgba(255,255,255,0.1) 0deg 360deg)`;
  moveRing.classList.add("pulse");
  setTimeout(() => moveRing.classList.remove("pulse"), 600);
}

// HISTÓRICO CHART.JS
const ctx = document.getElementById("weeklyChart").getContext("2d");
const weeklyChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    datasets: [
      { label: "Passos", data: weeklyData, backgroundColor: "#0a84ff" },
    ],
  },
  options: { responsive: true, plugins: { legend: { display: false } } },
});

// AUTH
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    userEmail.innerText = user.email;
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      simulatedSteps = docSnap.data().steps || 0;
      simulatedExercise = docSnap.data().exercise || 0;
      simulatedStand = docSnap.data().stand || 0;
    } else {
      simulatedSteps = 0;
      simulatedExercise = 0;
      simulatedStand = 0;
      await setDoc(docRef, { steps: 0, exercise: 0, stand: 0 });
    }
    animateSteps(simulatedSteps);
    updateRing(simulatedSteps, simulatedExercise, simulatedStand);
  } else {
    window.location.href = "index.html";
  }
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// SIMULA PASSOS AUTOMÁTICOS
setInterval(async () => {
  simulatedSteps += Math.floor(Math.random() * 3);
  simulatedExercise += Math.random() < 0.3 ? 1 : 0;
  simulatedStand += Math.random() < 0.05 ? 1 : 0;

  // atualiza gráfico
  weeklyData.shift();
  weeklyData.push(simulatedSteps);

  animateSteps(simulatedSteps);
  updateRing(simulatedSteps, simulatedExercise, simulatedStand);
  weeklyChart.data.datasets[0].data = weeklyData;
  weeklyChart.update();

  if (currentUser) {
    await setDoc(doc(db, "users", currentUser.uid), {
      steps: simulatedSteps,
      exercise: simulatedExercise,
      stand: simulatedStand,
    });
  }
}, 1000);
