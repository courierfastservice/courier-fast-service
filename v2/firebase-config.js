import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnLTZJ2gj78xVy7GNxt1jm69_3Kl1qjd4",
  authDomain: "courier-fast-service.firebaseapp.com",
  databaseURL: "https://courier-fast-service-default-rtdb.firebaseio.com",
  projectId: "courier-fast-service",
  storageBucket: "courier-fast-service.firebasestorage.app",
  messagingSenderId: "125928611197",
  appId: "1:125928611197:web:814ec8c23e99ce03690014",
  measurementId: "G-45EZ981SX8"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

export { app, database, storage };
