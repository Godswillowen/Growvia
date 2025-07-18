// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { 
  getFirestore, 
  setDoc, 
  doc, 
  getDoc, 
  collection, 
  addDoc 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQXqZVTGuuCwx9CylDK-EFCqsluW0wCfQ",
  authDomain: "growvia-cec41.firebaseapp.com",
  projectId: "growvia-cec41",
  storageBucket: "growvia-cec41.firebasestorage.app",
  messagingSenderId: "38230175289",
  appId: "1:38230175289:web:636a15a7ae9101249167e8",
  measurementId: "G-X571GKGH7P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to show messages
const showMessage = (message, targetDiv) => {
  const messageDiv = document.getElementById(targetDiv);
  messageDiv.style.display = "block";
  messageDiv.textContent = message;
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 3000);
};

// Fetch total sales for a user
const fetchTotalSales = async (userId, email) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnapshot = await getDoc(userDocRef);

    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      const totalStatics = userData.totalStatics || 0;
      const name = userData.firstName;
      console.log(name);
      document.getElementById("total_sales").textContent = `Total Sales: CZK ${totalStatics}`;
      document.getElementById("nameclass").textContent = `Name: ${name}`;
    } else {
      document.getElementById("total_sales").textContent = "Total Sales: $0";
      document.getElementById("nameclass").textContent = "Name:";
    }
  } catch (error) {
    console.error("Error fetching total sales:", error);
  }
};

// Monitor auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is logged in:", user.uid);
    console.log(user.email);
    fetchTotalSales(user.uid, user.email);
  } else {
    console.log("No user is logged in.");
    document.getElementById("total_sales").textContent = "Total Sales: $0";
  }
});

// Sign-Up logic with email verification
document.getElementById("submitSignUp").addEventListener("click", async (event) => {
  event.preventDefault();
  const firstName = document.getElementById("fName").value;
  const lastName = document.getElementById("lName").value;
  const email = document.getElementById("rEmail").value;
  const password = document.getElementById("rPassword").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user details in Firestore
    const userData = { email, firstName, lastName, totalStatics: 0 };
    await setDoc(doc(db, "users", user.uid), userData);

    // Send email verification
    await sendEmailVerification(user);
    showMessage("Account created successfully! Verification email sent. Please check your inbox.", "signUpMessage");

    // Sign out the user until email is verified
    await signOut(auth);
    setTimeout(() => window.location.href = "index.html", 3000);
  } catch (error) {
    showMessage("Error: " + error.message, "signUpMessage");
  }
});

// Sign-In logic with email verification check
document.getElementById("submitSignIn").addEventListener("click", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if the email is verified
    if (!user.emailVerified) {
      showMessage("Please verify your email before signing in.", "signInMessage");
      await signOut(auth);
      return;
    }

    await addDoc(collection(db, "users", user.uid, "userStatistics"), {
      timestamp: new Date().toISOString(),
      action: "User signed in",
      totalMoney: 0,
    });

    showMessage("Sign-In successful!", "signInMessage");
    setTimeout(() => window.location.href = "./loader.html", 2000);
  } catch (error) {
    showMessage("Error: " + error.message, "signInMessage");
  }
});

// Password Reset logic
document.querySelector(".recover a").addEventListener("click", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value;

  if (!email) {
    showMessage("Please enter your email to reset the password!", "signInMessage");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Password reset email sent. Check your inbox!", "signInMessage");
  } catch (error) {
    showMessage("Error: " + error.message, "signInMessage");
  }
});

// Toggle between Sign-Up and Sign-In forms
document.getElementById("signUpButton").addEventListener("click", () => {
  document.getElementById("signUp").style.display = "block";
  document.getElementById("signIn").style.display = "none";
});

document.getElementById("signInButton").addEventListener("click", () => {
  document.getElementById("signUp").style.display = "none";
  document.getElementById("signIn").style.display = "block";
});

// Fetch total sales on dashboard load
document.addEventListener("DOMContentLoaded", () => {
  const user = auth.currentUser;
  if (user) {
    fetchTotalSales(user.uid);
  }
});
