import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    // 1. Default date setup (Tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }

    // 2. Dodging "No" Button Setup
    const noBtn = document.getElementById('noBtn') || document.getElementById('runawayBtn');
    if (noBtn) {
        const moveNoButton = () => {
            const randomX = (Math.random() - 0.5) * 160; // moves left/right
            const randomY = (Math.random() - 0.5) * 100; // moves up/down
            noBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
        };

        // Move away when mouse hovers (Desktop)
        noBtn.addEventListener('mouseover', moveNoButton);

        // Move away when touched (Mobile)
        noBtn.addEventListener('touchstart', moveNoButton, { passive: true });
    }

    // 3. Start Real-Time Firestore Listener
    listenToLiveAttendees();
});

// =========================================================
// GLOBAL FUNCTIONS (EXPOSED FOR HTML ONCLICK ATTR)
// =========================================================

// "No" Button Popup Warning Handler
window.handleNoClick = function() {
    alert("🥊 Oh no you didn't! Say yes or get a tiny beating 👊💥");
};

// Instant View Switcher
window.goToStep = function(stepNumber) {
    const panels = document.querySelectorAll('.view-panel');
    const dots = document.querySelectorAll('.dot');
    
    panels.forEach(panel => panel.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    const targetPanel = document.getElementById(`view${stepNumber}`);
    const targetDot = document.getElementById(`dot${stepNumber}`);

    if (targetPanel) targetPanel.classList.add('active');
    if (targetDot) targetDot.classList.add('active');

    // Defer heavy Confetti animation so view transition remains smooth on mobile
    if (stepNumber === 3 && typeof confetti === 'function') {
        setTimeout(() => {
            confetti({
                particleCount: 50,
                spread: 50,
                origin: { y: 0.6 }
            });
        }, 100);
    }
};

window.selectVibe = function(element, vibeName) {
    document.querySelectorAll('.vibe-chip').forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');
    selectedVibeText = vibeName;
};

// Plan Submission Handler
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

    // STEP 2: ASYNCHRONOUS FIREBASE WRITE
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

// Listen to Firestore real-time updates & auto-delete expired dates
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

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let html = "";
            let activeCount = 0;

            snapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                
                let isPastDate = false;

                if (data.date) {
                    const currentYear = new Date().getFullYear();
                    const parsedDate = new Date(`${data.date}, ${currentYear}`);

                    if (!isNaN(parsedDate.getTime())) {
                        parsedDate.setHours(23, 59, 59, 999);
                        if (parsedDate < new Date()) {
                            isPastDate = true;
                        }
                    }
                }

                // Auto-delete expired dates from Firestore
                if (isPastDate) {
                    deleteDoc(doc(db, "hangout_attendees", docSnap.id)).catch(err => {
                        console.log("Auto-delete past event error:", err);
                    });
                    return;
                }

                activeCount++;
                
                html += `
                    <li class="squad-item">
                        <div class="squad-info">
                            <span class="squad-name">✍️ <b>${data.name || 'Anonymous'}</b></span>
                            <span class="squad-vibe">📍 ${data.vibe || 'Gathering'}</span>
                        </div>
                        <span class="time-tag">📅 ${data.date || '--'} @ ${data.time || '--'}</span>
                    </li>
                `;
            });

            if (countEl) countEl.textContent = activeCount;

            if (activeCount === 0) {
                listEl.innerHTML = "<li>No upcoming confirmed attendees. Lock your slot! ✍️</li>";
            } else {
                listEl.innerHTML = html;
            }

        }, (error) => {
            console.error("Firestore snapshot error:", error);
            const listEl = document.getElementById('liveAttendeeList');
            if (listEl) listEl.innerHTML = "<li>Unable to load live list.</li>";
        });
    } catch (err) {
        console.log("Firebase listening standby:", err);
    }
}

// Copy Action (Desktop & Mobile Compatible)
window.copyInvite = function() {
    const attendee = document.getElementById('ticketAttendee') ? document.getElementById('ticketAttendee').textContent.trim() : '';
    const when = document.getElementById('ticketWhen') ? document.getElementById('ticketWhen').textContent.trim() : '';
    const time = document.getElementById('ticketTime') ? document.getElementById('ticketTime').textContent.trim() : '';
    const vibe = document.getElementById('ticketVibe') ? document.getElementById('ticketVibe').textContent.trim() : '';

    const textToCopy = `🚫🔍 Hangout Plan — No PROBLEM Hunting!\n✍️ Confirmed By (Proof): ${attendee}\n📅 Date: ${when}\n⏰ Time: ${time}\n📍 Vibe: ${vibe}\n\nNo need to let us know if it works for u or not. U'r coming anyway. 🙅🏻‍♀️❌`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert("💌 Invite details copied to clipboard!");
        }).catch(() => {
            executeMobileCopy(textToCopy);
        });
    } else {
        executeMobileCopy(textToCopy);
    }
};

// Fallback Mobile Copy Engine
function executeMobileCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
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

    if (navigator.userAgent.match(/ipad|iphone/i)) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999);
    } else {
        textArea.focus();
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
