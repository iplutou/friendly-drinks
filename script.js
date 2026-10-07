import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Firebase Configuration (Paste your keys from Firebase Console)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const attendeesCollection = collection(db, "hangout_attendees");

let selectedVibeText = "Gathering at Home for Cooking Dinner 🍳";

document.addEventListener('DOMContentLoaded', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('dateInput').value = tomorrow.toISOString().split('T')[0];

    // Start real-time Firestore listener when site loads
    listenToLiveAttendees();
});

// Runaway No Button Logic
const runawayBtn = document.getElementById('runawayBtn');
if (runawayBtn) {
    const moveBtn = () => {
        const x = (Math.random() - 0.5) * 180;
        const y = (Math.random() - 0.5) * 120;
        runawayBtn.style.transform = `translate(${x}px, ${y}px)`;
    };
    runawayBtn.addEventListener('mouseover', moveBtn);
    runawayBtn.addEventListener('touchstart', moveBtn);
}

// Navigation between views
window.goToStep = function(stepNumber) {
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.dot').forEach(dot => dot.classList.remove('active'));

    document.getElementById(`view${stepNumber}`).classList.add('active');
    document.getElementById(`dot${stepNumber}`).classList.add('active');
};

// Select Hangout Vibe Option
window.selectVibe = function(element, vibeName) {
    document.querySelectorAll('.vibe-chip').forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');
    selectedVibeText = vibeName;
};

// Handle Form Submission: Save user to Firebase live collection
window.handlePlanSubmit = async function(event) {
    event.preventDefault();

    const attendeeName = document.getElementById('attendeeNameInput').value.trim();
    const dateVal = document.getElementById('dateInput').value;
    const timeVal = document.getElementById('timeInput').value;

    const formattedDate = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    try {
        // Add new confirmation document directly to Firebase Firestore
        await addDoc(attendeesCollection, {
            name: attendeeName,
            date: formattedDate,
            time: timeVal,
            vibe: selectedVibeText,
            timestamp: serverTimestamp()
        });

        document.getElementById('ticketWhen').textContent = formattedDate;
        document.getElementById('ticketTime').textContent = timeVal;
        document.getElementById('ticketVibe').textContent = selectedVibeText;

        goToStep(3);
    } catch (error) {
        console.error("Error saving signature:", error);
        alert("Failed to submit signature. Check console log.");
    }
};

// Listen to Firestore real-time updates across all devices
function listenToLiveAttendees() {
    const q = query(attendeesCollection, orderBy("timestamp", "asc"));

    onSnapshot(q, (snapshot) => {
        const listEl = document.getElementById('liveAttendeeList');
        const countEl = document.getElementById('attendeeCount');

        if (snapshot.empty) {
            listEl.innerHTML = "<li>No confirmed attendees yet. Be the first! ✍️</li>";
            countEl.textContent = "0";
            return;
        }

        countEl.textContent = snapshot.docs.length;
        let html = "";

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            html += `
                <li>
                    <span>✍️ <b>${data.name}</b></span>
                    <span class="time-tag">📅 ${data.date} @ ${data.time}</span>
                </li>
            `;
        });

        listEl.innerHTML = html;
    });
}

// Copy Action
window.copyInvite = function() {
    const when = document.getElementById('ticketWhen').textContent;
    const time = document.getElementById('ticketTime').textContent;
    const vibe = document.getElementById('ticketVibe').textContent;

    const text = `🚫🔍 Hangout Plan — Live List Updated!\n📅 Date: ${when}\n⏰ Time: ${time}\n📍 Vibe: ${vibe}\n\nCheck out who's already signed on the live squad list! 🙅🏻‍♀️❌`;

    navigator.clipboard.writeText(text).then(() => {
        alert("Invite text copied to clipboard!");
    });
};
