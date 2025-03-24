// Firebase Config (Replace with your Firebase details)
const firebaseConfig = {
    apiKey: "AIzaSyCNhAhPGNQgSm6SL9j3GdZwm0S6NeFCNnw",
    authDomain: "qr-scanner-6e936.firebaseapp.com",
    projectId: "qr-scanner-6e936",
    storageBucket: "qr-scanner-6e936.firebasestorage.app",
    messagingSenderId: "95323560168",
    appId: "1:95323560168:web:b4a9918e568ae2bc63515d",
    measurementId: "G-1B3FPJDW8C"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const html5QrCode = new Html5Qrcode("reader");

document.getElementById("scan-btn").addEventListener("click", function() {
    document.getElementById("reader").style.display = "block";
    document.getElementById("result").innerText = "Scanning...";
    
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (qrCodeMessage) => {
            checkQRCode(qrCodeMessage);
            html5QrCode.stop(); // Stop scanning after one scan
        }
    );
});

function checkQRCode(qrCodeMessage) {
    document.getElementById("result").innerText = "Checking QR Code...";

    const qrRef = db.collection("participants").doc(qrCodeMessage);

    qrRef.get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.used) {
                document.getElementById("result").innerText = "❌ QR Code Already Used!";
            } else {
                qrRef.update({ used: true });
                document.getElementById("result").innerText = "✅ Entry Allowed!";
            }
        } else {
            document.getElementById("result").innerText = "❌ Invalid QR Code!";
        }
    }).catch((error) => {
        console.error(error);
        document.getElementById("result").innerText = "❌ Error Checking QR Code!";
    });
}