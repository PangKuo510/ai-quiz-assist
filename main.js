
let questions = [];
let currentIndex = 0;
let score = 0;

async function loadQuestions() {
  const res = await fetch("ai_question_bank_v1_fixed.json");
  if (!res.ok) throw new Error("題庫載入失敗");
  questions = await res.json();
  renderQuestion();
}

function renderQuestion() {
  const container = document.getElementById("quiz-container");
  const q = questions[currentIndex];
  container.innerHTML = `
    <div class="question-block">
      <h2>第 ${currentIndex + 1} 題：${q.question}</h2>
      <div class="options">
        ${q.options.map((opt, i) =>
          `<button onclick="selectOption(${i}, this)">${opt}</button>`
        ).join('')}
      </div>
      <div class="explanation hidden" id="explanation"></div>
      <button id="next-btn" class="hidden" onclick="nextQuestion()">下一題</button>
    </div>
  `;
  updateProgressBar();
}

function selectOption(index, btn) {
  const q = questions[currentIndex];
  const buttons = document.querySelectorAll(".options button");
  buttons.forEach((b, i) => {
    b.classList.add("disabled");
    if (i === q.answer) b.classList.add("correct");
    if (i === index && i !== q.answer) b.classList.add("incorrect");
  });

  if (index === q.answer) score++;

  const exp = document.getElementById("explanation");
  exp.classList.remove("hidden");
  exp.innerHTML = "📘 解析：" + q.explanation;

  document.getElementById("next-btn").classList.remove("hidden");
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex < questions.length) {
    renderQuestion();
  } else {
    showResult();
  }
}

function updateProgressBar() {
  const progress = (currentIndex / questions.length) * 100;
  const bar = document.getElementById("progress-bar");
  bar.style.width = progress + "%";
  if (progress <= 25) bar.style.backgroundColor = "red";
  else if (progress <= 50) bar.style.backgroundColor = "orange";
  else if (progress <= 75) bar.style.backgroundColor = "gold";
  else bar.style.backgroundColor = "#2563eb";
}

function showResult() {
  const resultBox = document.getElementById("result-container");
  const container = document.getElementById("quiz-container");
  container.classList.add("hidden");
  resultBox.classList.remove("hidden");

  const percentage = (score / questions.length) * 100;
  let level = "";
  if (percentage >= 90) level = "S 級（頂尖 AI 精英！）";
  else if (percentage >= 70) level = "A 級（潛力強勁的技術者！）";
  else if (percentage >= 50) level = "B 級（持續進步的學習者）";
  else level = "C 級（繼續努力就能迎頭趕上）";

  resultBox.innerHTML = `
    <h2>🎉 測驗完成！</h2>
    <p>得分：${score} / ${questions.length}</p>
    <p>答對率：${percentage.toFixed(1)}%</p>
    <p>等級評價：<strong>${level}</strong></p>
  `;
}

loadQuestions().catch(err => {
  document.getElementById("quiz-container").innerHTML = "<p style='color:red;'>🚫 題庫載入失敗</p>";
});
