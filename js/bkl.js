      // Your Firebase configuration
      const firebaseConfig = {
        apiKey: "AIzaSyDDvMT4xqAEauAeEt0Fq4y-it2Mvwzng60",
        authDomain: "vishesh-314e3.firebaseapp.com",
        projectId: "vishesh-314e3",
        storageBucket: "vishesh-314e3.firebasestorage.app",
        messagingSenderId: "144407725016",
        appId: "1:144407725016:web:d9e067644487b6c9caa8ad",
       
      };

      // Initialize Firebase
      const app = firebase.initializeApp(firebaseConfig);
      const db = firebase.firestore(app);
