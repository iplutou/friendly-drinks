const noBtn = document.getElementById('noBtn');
let selectedDrinkType = "";

// Set default date to today & default time on load
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = today;
    document.getElementById('eventTime').value = "18:00";
});

// Runaway "No" button logic
function moveNoButton() {
    const container = document.getElementById('drinksContainer');
    const containerRect = container.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();

    const maxX = containerRect.width - btnRect.width - 40;
    const maxY = containerRect.height - btnRect.height - 40;

    const randomX = Math.floor(Math.random() * maxX) - (containerRect.width / 2 - btnRect.width);
    const randomY = Math.floor(Math.random() * maxY) - (containerRect.height / 2 - btnRect.height);

    noBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
}

if (noBtn) {
    noBtn.addEventListener('mouseover', moveNoButton);
    noBtn.addEventListener('click', moveNoButton);
}

// "Yes" Click Handler -> Transitions to Date/Time form
function handleYesClick() {
    document.getElementById('questionView').classList.remove('active');
    document.getElementById('inviteView').classList.add('active');
}

// Drink Option Card Selection
function selectDrink(cardElement, drinkName) {
    document.querySelectorAll('.option-card').forEach(card => card.classList.remove('selected'));
    cardElement.classList.add('selected');
    selectedDrinkType = drinkName;
}

// Form Submission Handler -> Transitions to Summary
function handleFormSubmit(event) {
    event.preventDefault();

    const dateVal = document.getElementById('eventDate').value;
    const timeVal = document.getElementById('eventTime').value;

    if (!selectedDrinkType) {
        alert("Please select a drink vibe!");
        return;
    }

    const formattedDate = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    document.getElementById('summaryDate').textContent = formattedDate;
    document.getElementById('summaryTime').textContent = timeVal;
    document.getElementById('summaryDrink').textContent = selectedDrinkType;

    document.getElementById('inviteView').classList.remove('active');
    document.getElementById('confirmView').classList.add('active');
}

// Copy Invitation Text
function copyPlan() {
    const date = document.getElementById('summaryDate').textContent;
    const time = document.getElementById('summaryTime').textContent;
    const drink = document.getElementById('summaryDrink').textContent;

    const inviteText = `🍻 Drinks Hangout!\n📅 Date: ${date}\n⏰ Time: ${time}\n🍹 Vibe: ${drink}\n\nLet me know if you're in!`;

    navigator.clipboard.writeText(inviteText).then(() => {
        alert("Invitation text copied! Share it with your friends.");
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
}
