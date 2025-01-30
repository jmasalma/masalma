// Replace with your Google Apps Script URL
const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_SCRIPT_URL_HERE";

// Questions array (update with 30 questions)
const questions = {
  1: "What is the first meal eaten after sunset during Ramadan called?",
  2: "Which Surah in the Quran mentions Ramadan?",
  // ...add all 30 questions
};

$(document).ready(function() {
  // Load today's question
  const today = new Date().getDate();
  $('#question-text').text(questions[today] || "No question for today!");

  // Submit handler
  $('#submit-btn').click(function() {
    const answer = $('#answer-input').val().trim();
    const name = $('#name-input').val().trim();
    const day = today;

    if (!answer || !name) {
      showMessage('⚠️ Please fill all fields!', 'warning');
      return;
    }

    // Show loading state
    $(this).html(
      '<span class="spinner-border spinner-border-sm" role="status"></span> Submitting...'
    ).prop('disabled', true);

    // Send to Google Sheets
    $.ajax({
      url: GOOGLE_SCRIPT_URL,
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify({
        questionNumber: day,
        answer: answer,
        name: name
      }),
      success: () => {
        showMessage('✅ Answer submitted!', 'success');
        $('#answer-input, #name-input').val('');
      },
      error: () => showMessage('❌ Submission failed. Try again!', 'danger'),
      complete: () => {
        $('#submit-btn').html('Submit Answer').prop('disabled', false);
      }
    });
  });
});

function showMessage(text, type) {
  $('#response-message')
    .removeClass()
    .addClass(`alert alert-${type} mt-3`)
    .text(text)
    .fadeIn()
    .delay(3000)
    .fadeOut();
}
