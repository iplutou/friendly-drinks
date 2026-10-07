import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. YOUR REAL FIREBASE KEYS
const firebaseConfig = {
    apiKey: "AIzaSyDHT50bejupdQbnGKeryXPmCD5J9fI3qkA",
    authDomain: "hangout-planner-29d48.firebaseapp.com",
    projectId: "hangout-planner-29d48",
    storageBucket: "hangout-planner-29d48.firebasestorage.app",
    messagingSenderId: "1020974558315",
    appId: "1:1020974558315:web:72725b6eb6be948a9d952e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const attendeesCollection = collection(db, "hangout_attendees");

let selectedVibeText = "Gathering at Home for Cooking Dinner 🍳";

document.addEventListener('DOMContentLoaded', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }

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

    // Start real-time Firestore listener
    listenToLiveAttendees();
});

// EXPOSE FUNCTIONS GLOBALLY FOR HTML ONCLICK ATTRIBUTES:

window.goToStep = function(stepNumber) {
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.dot').forEach(dot => dot.classList.remove('active'));

    const targetPanel = document.getElementById(`view${stepNumber}`);
    const targetDot = document.getElementById(`dot${stepNumber}`);
    if (targetPanel) targetPanel.classList.add('active');
    if (targetDot) targetDot.classList.add('active');
};

window.selectVibe = function(element, vibeName) {
    document.querySelectorAll('.vibe-chip').forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');
    selectedVibeText = vibeName;
};

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

    const elWhen = document.getElementById('ticketWhen');
    const elTime = document.getElementById('ticketTime');
    const elVibe = document.getElementById('ticketVibe');

    if (elWhen) elWhen.textContent = formattedDate;
    if (elTime) elTime.textContent = timeVal;
    if (elVibe) elVibe.textContent = selectedVibeText;

    try {
        await addDoc(attendeesCollection, {
            name: attendeeName,
            date: formattedDate,
            time: timeVal,
            vibe: selectedVibeText,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Firebase write notice:", error);
    }

    window.goToStep(3);
};

function listenToLiveAttendees() {
    try {
        const q = query(attendeesCollection, orderBy("timestamp", "asc"));

        onSnapshot(q, (snapshot) => {
            const listEl = document.getElementById('liveAttendeeList');
            const countEl = document.getElementById('attendeeCount');

            if (!listEl) return;

            if (snapshot.empty) {
                listEl.innerHTML = "<li>No confirmed attendees yet. Be the first! ✍️</li>";
                if (countEl) countEl.textContent = "0";
                return;
            }

            if (countEl) countEl.textContent = snapshot.docs.length;
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
    } catch (err) {
        console.log("Firebase listening standby:", err);
    }
}

window.copyInvite = function() {
    const when = document.getElementById('ticketWhen') ? document.getElementById('ticketWhen').textContent : '';
    const time = document.getElementById('ticketTime') ? document.getElementById('ticketTime').textContent : '';
    const vibe = document.getElementById('ticketVibe') ? document.getElementById('ticketVibe').textContent : '';

    const text = `🚫🔍 Hangout Plan — No PROBLEM Hunting!\n✍️ Confirmed By (Proof): ${attendee}\n📅 Date: ${when}\n⏰ Time: ${time}\n📍 Vibe: ${vibe}\n\nNo need to let us know if it works for u or not. U'r coming anyway. 🙅🏻‍♀️❌`;

    navigator.clipboard.writeText(text).then(() => {
        alert("Invite details copied to clipboard!");
    });
};
