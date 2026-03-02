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

const stepsElement = document.getElementById("steps");
const addBtn = document.getElementById("addBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");

let currentUser;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    userEmail.innerText = user.email;

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      stepsElement.innerText = docSnap.data().steps;
      updateRing(docSnap.data().steps);
    } else {
      await setDoc(docRef, { steps: 0 });
      stepsElement.innerText = 0;
    }
  } else {
    window.location.href = "index.html";
  }
});

addBtn.addEventListener("click", async () => {
  const addSteps = parseInt(document.getElementById("addSteps").value);
  if (!addSteps) return;

  const newSteps = parseInt(stepsElement.innerText) + addSteps;
  stepsElement.innerText = newSteps;
  updateRing(newSteps);

  await setDoc(doc(db, "users", currentUser.uid), {
    steps: newSteps,
  });
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

const moveRing = document.querySelector(".move");

function updateRing(steps) {
  const goal = 10000;
  const percentage = Math.min(steps / goal, 1);
  const degrees = percentage * 360;

  moveRing.style.background = `
    conic-gradient(
      #ff375f 0deg,
      #ff375f ${degrees}deg,
      rgba(255,255,255,0.1) ${degrees}deg,
      rgba(255,255,255,0.1) 360deg
    )
  `;
}
