
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDcyrKxVwDNfRWlZilDH3rzWi2s2kjClwY",
  authDomain: "safetourism.firebaseapp.com",
  projectId: "safetourism",
  storageBucket: "safetourism.firebasestorage.app",
  messagingSenderId: "1049359558422",
  appId: "1:1049359558422:web:040ac3c000fad1cd8ad237",
};

const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
