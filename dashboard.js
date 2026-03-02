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

/* ================= FIREBASE ================= */

const firebaseConfig = {
  apiKey: "SUA_KEY",
  authDomain: "steptracker-pro.firebaseapp.com",
  projectId: "steptracker-pro",
  storageBucket: "steptracker-pro.firebasestorage.app",
  messagingSenderId: "841144123231",
  appId: "SUA_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= ELEMENTOS ================= */

const stepsElement = document.getElementById("steps");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");
const moveRing = document.querySelector(".move");
const exerciseRing = document.getElementById("exerciseRing");
const standRing = document.getElementById("standRing");

let currentUser;
let steps = 0;
let exercise = 0;
let stand = 0;
let weeklyData = Array(7).fill(0);

/* ================= TEMA AUTOMÁTICO ================= */

function setTheme() {
  const hour = new Date().getHours();
  document.body.classList.toggle("dark", hour >= 19 || hour < 6);
  document.body.classList.toggle("light", hour >= 6 && hour < 19);
}
setTheme();

/* ================= ANIMA PASSOS ================= */

function animateSteps(target) {
  let start = parseInt(stepsElement.innerText) || 0;
  const duration = 600;
  const startTime = performance.now();

  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    stepsElement.innerText = Math.floor(
      start + (target - start) * progress
    );
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ================= ATUALIZA ANÉIS ================= */

function updateRing() {
  moveRing.style.background = `conic-gradient(#ff375f ${Math.min(
    (steps / 10000) * 360,
    360
  )}deg, rgba(255,255,255,0.1) 0deg)`;

  exerciseRing.parentElement.style.background = `conic-gradient(#32d74b ${Math.min(
    (exercise / 60) * 360,
    360
  )}deg, rgba(255,255,255,0.1) 0deg)`;

  standRing.parentElement.style.background = `conic-gradient(#0a84ff ${Math.min(
    (stand / 12) * 360,
    360
  )}deg, rgba(255,255,255,0.1) 0deg)`;

  moveRing.classList.add("pulse");
  setTimeout(() => moveRing.classList.remove("pulse"), 400);
}

/* ================= GRÁFICO ================= */

const ctx = document.getElementById("weeklyChart").getContext("2d");
const weeklyChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    datasets: [
      {
        label: "Passos",
        data: weeklyData,
        backgroundColor: "#0a84ff",
      },
    ],
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
  },
});

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  userEmail.innerText = user.email;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    steps = snap.data().steps || 0;
    exercise = snap.data().exercise || 0;
    stand = snap.data().stand || 0;
  } else {
    await setDoc(ref, { steps: 0, exercise: 0, stand: 0 });
  }

  animateSteps(steps);
  updateRing();
});

/* ================= LOGOUT ================= */

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

/* ================= CONTADOR REAL ================= */

let lastStepTime = 0;
const threshold = 13; // sensibilidade
const stepDelay = 450; // tempo mínimo entre passos
let ready = false;

// espera 2 segundos pra evitar contagem inicial
setTimeout(() => {
  ready = true;
}, 2000);

// Permissão iPhone
if (typeof DeviceMotionEvent.requestPermission === "function") {
  document.body.addEventListener(
    "click",
    async () => {
      await DeviceMotionEvent.requestPermission();
    },
    { once: true }
  );
}

window.addEventListener("devicemotion", async (event) => {
  if (!ready) return;

  const acc = event.accelerationIncludingGravity;
  if (!acc) return;

  const magnitude = Math.sqrt(
    acc.x * acc.x +
    acc.y * acc.y +
    acc.z * acc.z
  );

  const now = Date.now();

  if (magnitude > threshold && now - lastStepTime > stepDelay) {
    steps++;
    exercise += 0.2;

    animateSteps(steps);
    updateRing();

    weeklyData[weeklyData.length - 1] = steps;
    weeklyChart.update();

    lastStepTime = now;

    if (currentUser) {
      await setDoc(doc(db, "users", currentUser.uid), {
        steps,
        exercise,
        stand,
      });
    }
  }
});