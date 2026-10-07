let selectedDrinkType = "";

// Set default date to today in input field
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = today;
    document.getElementById('eventTime').value = "18:00";
});

// Selection for Drink Vibe
function selectDrink(cardElement, drinkName) {
    document.querySelectorAll('.option-card').forEach(card => card.classList.remove('selected'));
    cardElement.classList.add('selected');
    selectedDrinkType = drinkName;
}

// Form Submission Handler
function handleFormSubmit(event) {
    event.preventDefault();

    const dateVal = document.getElementById('eventDate').value;
    const timeVal = document.getElementById('eventTime').value;

    if (!selectedDrinkType) {
        alert("Please select a drink vibe!");
        return;
    }

    // Format Date nicely (e.g., Friday, Oct 10)
    const formattedDate = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    // Populate Summary
    document.getElementById('summaryDate').textContent = formattedDate;
    document.getElementById('summaryTime').textContent = timeVal;
    document.getElementById('summaryDrink').textContent = selectedDrinkType;

    // Switch View
    document.getElementById('inviteView').classList.remove('active');
    document.getElementById('confirmView').classList.add('active');
}

// Copy invitation details to share with group chat
function copyPlan() {
    const date = document.getElementById('summaryDate').textContent;
    const time = document.getElementById('summaryTime').textContent;
    const drink = document.getElementById('summaryDrink').textContent;

    const inviteText = `🍻 Drinks Hangout!\n📅 Date: ${date}\n⏰ Time: ${time}\n🍹 Vibe: ${drink}\n\nLet me know if you're in!`;

    navigator.clipboard.writeText(inviteText).then(() => {
        alert("Invitation text copied! Share it in your group chat.");
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
}