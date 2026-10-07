let selectedVibeText = "Gathering at Home for Cooking Dinner 🍳";

document.addEventListener('DOMContentLoaded', () => {
    // Default date set to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('dateInput').value = tomorrow.toISOString().split('T')[0];
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
function goToStep(stepNumber) {
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.dot').forEach(dot => dot.classList.remove('active'));

    document.getElementById(`view${stepNumber}`).classList.add('active');
    document.getElementById(`dot${stepNumber}`).classList.add('active');
}

// Select Hangout Vibe Option
function selectVibe(element, vibeName) {
    document.querySelectorAll('.vibe-chip').forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');
    selectedVibeText = vibeName;
}

// Submit Form Action
function handlePlanSubmit(event) {
    event.preventDefault();

    const dateVal = document.getElementById('dateInput').value;
    const timeVal = document.getElementById('timeInput').value;

    const formattedDate = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    document.getElementById('ticketWhen').textContent = formattedDate;
    document.getElementById('ticketTime').textContent = timeVal;
    document.getElementById('ticketVibe').textContent = selectedVibeText;

    goToStep(3);
}

// Copy Text Action
function copyInvite() {
    const when = document.getElementById('ticketWhen').textContent;
    const time = document.getElementById('ticketTime').textContent;
    const vibe = document.getElementById('ticketVibe').textContent;

    const text = `🚫🔍 Hangout Plan — No PROBLEM Hunting!\n📅 Date: ${when}\n⏰ Time: ${time}\n📍 Vibe: ${vibe}\n\nNo need to let us know if it works for u or not. U'r coming anyway. 🙅🏻‍♀️❌
`;

    navigator.clipboard.writeText(text).then(() => {
        alert("Invite details copied to clipboard!");
    });
}
