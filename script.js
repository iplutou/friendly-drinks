import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHT50bejupdQbnGKeryXPmCD5J9fI3qkA",
  authDomain: "hangout-planner-29d48.firebaseapp.com",
  projectId: "hangout-planner-29d48",
  storageBucket: "hangout-planner-29d48.firebasestorage.app",
  messagingSenderId: "1020974558315",
  appId: "1:1020974558315:web:72725b6eb6be948a9d952e",
  measurementId: "G-75K6Z2DZVL"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const attendeesCollection = collection(db, "hangout_attendees");

let selectedVibeText = "Gathering at Home for Cooking Dinner 🍳";

document.addEventListener('DOMContentLoaded', () => {
    // Set default date to tomorrow
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
        runawayBtn.addEventListener('touchstart', moveBtn, { passive: true });
    }

    // Start Real-Time Firestore Listener
    listenToLiveAttendees();
});

// EXPOSE GLOBAL FUNCTIONS FOR HTML ATTR (ONCLICK)

// Navigation between views with Confetti Trigger
window.goToStep = function(stepNumber) {
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.dot').forEach(dot => dot.classList.remove('active'));

    const targetPanel = document.getElementById(`view${stepNumber}`);
    const targetDot = document.getElementById(`dot${stepNumber}`);
    if (targetPanel) targetPanel.classList.add('active');
    if (targetDot) targetDot.classList.add('active');

    // Trigger Confetti Celebration when entering View 3
    if (stepNumber === 3 && typeof confetti === 'function') {
        confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
        });
    }
};

window.selectVibe = function(element, vibeName) {
    document.querySelectorAll('.vibe-chip').forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');
    selectedVibeText = vibeName;
};

window.handlePlanSubmit = function(event) {
    event.preventDefault();

    const attendeeName = document.getElementById('attendeeNameInput').value.trim();
    const dateVal = document.getElementById('dateInput').value;
    const timeVal = document.getElementById('timeInput').value;

    const formattedDate = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    // 1. Update UI ticket elements instantly
    const elAttendee = document.getElementById('ticketAttendee');
    const elWhen = document.getElementById('ticketWhen');
    const elTime = document.getElementById('ticketTime');
    const elVibe = document.getElementById('ticketVibe');

    if (elAttendee) elAttendee.textContent = attendeeName;
    if (elWhen) elWhen.textContent = formattedDate;
    if (elTime) elTime.textContent = timeVal;
    if (elVibe) elVibe.textContent = selectedVibeText;

    // 2. Switch view IMMEDIATELY for zero lag on mobile
    window.goToStep(3);

    // 3. Save to Firestore asynchronously in background (non-blocking)
    addDoc(attendeesCollection, {
        name: attendeeName,
        date: formattedDate,
        time: timeVal,
        vibe: selectedVibeText,
        timestamp: serverTimestamp()
    }).catch((error) => {
        console.error("Firebase background write error:", error);
    });
};

// Listen to Firestore real-time updates
function listenToLiveAttendees() {
    try {
        onSnapshot(attendeesCollection, (snapshot) => {
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
                        <span>✍️ <b>${data.name || 'Anonymous'}</b></span>
                        <span class="time-tag">📅 ${data.date || '--'} @ ${data.time || '--'}</span>
                    </li>
                `;
            });

            listEl.innerHTML = html;
        }, (error) => {
            console.error("Firestore snapshot error:", error);
            const listEl = document.getElementById('liveAttendeeList');
            if (listEl) listEl.innerHTML = "<li>Unable to load live list. Check Firebase rules.</li>";
        });
    } catch (err) {
        console.log("Firebase listening standby:", err);
    }
}

// Mobile-Compatible Copy Action
window.copyInvite = function() {
    const attendee = document.getElementById('ticketAttendee') ? document.getElementById('ticketAttendee').textContent : '';
    const when = document.getElementById('ticketWhen') ? document.getElementById('ticketWhen').textContent : '';
    const time = document.getElementById('ticketTime') ? document.getElementById('ticketTime').textContent : '';
    const vibe = document.getElementById('ticketVibe') ? document.getElementById('ticketVibe').textContent : '';

    const text = `🚫🔍 Hangout Plan — No PROBLEM Hunting!\n✍️ Confirmed By (Proof): ${attendee}\n📅 Date: ${when}\n⏰ Time: ${time}\n📍 Vibe: ${vibe}\n\nNo need to let us know if it works for u or not. U'r coming anyway. 🙅🏻‍♀️❌`;

    // Modern Clipboard API with Mobile Fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert("Invite details copied to clipboard!");
        }).catch(() => {
            fallbackCopyText(text);
        });
    } else {
        fallbackCopyText(text);
    }
};

// Fallback Copy Function for Mobile WebViews & iOS Safari
function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert("Invite details copied to clipboard!");
        } else {
            alert("Copy failed. Please copy manually.");
        }
    } catch (err) {
        alert("Copy failed. Please copy manually.");
    }

    document.body.removeChild(textArea);
}
