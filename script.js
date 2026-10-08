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
    // Default date setup
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

// Instant View Switcher optimized for Mobile
window.goToStep = function(stepNumber) {
    // 1. Hide current views immediately
    const panels = document.querySelectorAll('.view-panel');
    const dots = document.querySelectorAll('.dot');
    
    panels.forEach(panel => panel.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    const targetPanel = document.getElementById(`view${stepNumber}`);
    const targetDot = document.getElementById(`dot${stepNumber}`);

    if (targetPanel) targetPanel.classList.add('active');
    if (targetDot) targetDot.classList.add('active');

    // 2. Defer heavy Confetti animation so it doesn't block view switching on mobile
    if (stepNumber === 3 && typeof confetti === 'function') {
        setTimeout(() => {
            confetti({
                particleCount: 50, // Reduced count for mobile devices
                spread: 50,
                origin: { y: 0.6 }
            });
        }, 100); // 100ms delay allows the DOM to finish painting View 3 first
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

    // Update ticket text immediately
    const elAttendee = document.getElementById('ticketAttendee');
    const elWhen = document.getElementById('ticketWhen');
    const elTime = document.getElementById('ticketTime');
    const elVibe = document.getElementById('ticketVibe');

    if (elAttendee) elAttendee.textContent = attendeeName;
    if (elWhen) elWhen.textContent = formattedDate;
    if (elTime) elTime.textContent = timeVal;
    if (elVibe) elVibe.textContent = selectedVibeText;

    // STEP 1: SWITCH VIEW INSTANTLY
    window.goToStep(3);

    // STEP 2: ASYNCHRONOUS FIREBASE WRITE (Non-blocking)
    setTimeout(() => {
        addDoc(attendeesCollection, {
            name: attendeeName,
            date: formattedDate,
            time: timeVal,
            vibe: selectedVibeText,
            timestamp: serverTimestamp()
        }).catch((error) => {
            console.error("Firebase background sync error:", error);
        });
    }, 50);
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
            if (listEl) listEl.innerHTML = "<li>Unable to load live list.</li>";
        });
    } catch (err) {
        console.log("Firebase listening standby:", err);
    }
}

// Mobile-Compatible Copy Action (iOS Safari & Android Ready)
window.copyInvite = function() {
    const attendee = document.getElementById('ticketAttendee') ? document.getElementById('ticketAttendee').textContent.trim() : '';
    const when = document.getElementById('ticketWhen') ? document.getElementById('ticketWhen').textContent.trim() : '';
    const time = document.getElementById('ticketTime') ? document.getElementById('ticketTime').textContent.trim() : '';
    const vibe = document.getElementById('ticketVibe') ? document.getElementById('ticketVibe').textContent.trim() : '';

    const textToCopy = `🚫🔍 Hangout Plan — No PROBLEM Hunting!\n✍️ Confirmed By (Proof): ${attendee}\n📅 Date: ${when}\n⏰ Time: ${time}\n📍 Vibe: ${vibe}\n\nNo need to let us know if it works for u or not. U'r coming anyway. 🙅🏻‍♀️❌`;

    // Try standard Web Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert("💌 Invite details copied to clipboard!");
        }).catch(() => {
            mobileFallbackCopy(textToCopy);
        });
    } else {
        mobileFallbackCopy(textToCopy);
    }
};

// Robust Fallback Copy for iOS Safari, WebViews, and HTTP pages
function mobileFallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Prevent iOS keyboard pop-up and scrolling glitches
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    textArea.setAttribute("readonly", "");

    document.body.appendChild(textArea);

    // iOS Safari selection range selection fix
    if (navigator.userAgent.match(/ipad|iphone/i)) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999);
    } else {
        textArea.select();
    }

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert("💌 Invite details copied to clipboard!");
        } else {
            alert("Copy failed. Please copy manually.");
        }
    } catch (err) {
        alert("Copy failed. Please copy manually.");
    }

    document.body.removeChild(textArea);
}
