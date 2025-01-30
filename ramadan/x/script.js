// Replace with your Google Apps Script URL
const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_SCRIPT_URL_HERE";

// Sample questions (replace with 30 questions)
const questions = {
  1: "What is the first meal eaten after sunset during Ramadan called?",
  2: "Which Surah in the Quran mentions Ramadan?",
  // ...add questions for all 30 days
};

function getCurrentDay() {
  const today = new Date();
  return today.getDate(); // Assumes Ramadan starts on the 1st of the month
}

function loadQuestion() {
  const day = getCurrentDay();
  document.getElementById("question-text").textContent = questions[day] || "No question for today!";
}

async function submitAnswer() {
  const answer = document.getElementById("answer-input").value;
  const name = document.getElementById("name-input").value;
  const day = getCurrentDay();

  const data = {
    questionNumber: day,
    answer: answer,
    name: name
  };

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data)
    });
    const result = await response.json();
    document.getElementById("response-message").innerHTML = "✅ Answer submitted!";
  } catch (error) {
    document.getElementById("response-message").innerHTML = "❌ Error submitting answer.";
  }
}

// Load today's question on page load
window.onload = loadQuestion;
