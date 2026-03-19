import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlqviz3CSecuxvRe_IYOKFNFFFLx7_KYs",
  authDomain: "zunitra.firebaseapp.com",
  projectId: "zunitra",
  storageBucket: "zunitra.firebasestorage.app",
  messagingSenderId: "28187912461",
  appId: "1:28187912461:web:3ff878061a9d866a5ce844"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
