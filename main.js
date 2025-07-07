let questions = [];
let filteredQuestions = [];
let wrongBook = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let totalToAnswer = 0;

const app = document.getElementById("root");

// 顏色進度條分級
function getProgressColor(percent) {
  if (percent <= 25) return "#ef4444"; // 紅
  if (percent <= 50) return "#f59e0b"; // 橙
  if (percent <= 75) return "#fde047"; // 黃
  return "#2563eb"; // 藍
}

function getGrade(score) {
  if (score >= 90) return {level:"S", msg:"表現優異，已具備出色的AI應用能力！"};
  if (score >= 75) return {level:"A", msg:"表現良好，請再加強細節可更進一步。"};
  if (score >= 60) return {level:"B", msg:"基本掌握，但尚有提升空間，加油！"};
  return {level:"C", msg:"建議加強基礎，持續努力會有進步！"};
}

// 載入題庫
fetch("ai_question_bank_v1_fixed.json")
  .then(res => {
    if (!res.ok) throw new Error("題庫載入失敗");
    return res.json();
  })
  .then(data => {
    questions = data;
    renderStartScreen();
  })
  .catch(err => {
    app.innerHTML = "<p style='color:red;'>🚫 題庫載入失敗，請稍後重試。</p>";
  });

function saveQuizProgress() {
  const state = {
    filteredQuestions,
    currentQuestionIndex,
    correctCount,
    totalToAnswer
  };
  localStorage.setItem("ai_quiz_saved_progress", JSON.stringify(state));
}

function clearQuizProgress() {
  localStorage.removeItem("ai_quiz_saved_progress");
}

function loadQuizProgress() {
  const state = JSON.parse(localStorage.getItem("ai_quiz_saved_progress"));
  if (!state) return;
  filteredQuestions = state.filteredQuestions;
  currentQuestionIndex = state.currentQuestionIndex;
  correctCount = state.correctCount;
  totalToAnswer = state.totalToAnswer;
  renderQuestion();
}

function renderStartScreen() {
  const lastScore = localStorage.getItem("ai_quiz_last_score") || "尚無紀錄";
  const lastDate = localStorage.getItem("ai_quiz_last_date") || "未曾練習";
  const hasProgress = localStorage.getItem("ai_quiz_saved_progress");
  const categories = [...new Set(questions.map(q => q.category))];
  app.innerHTML = `
    <h1 style='color:#2563eb'>AI應用規劃師教練</h1>
    <p>為 AI應用規劃師考照打造的每日練習工具</p>
    <p>📊 最近分數：${lastScore}%，最後練習：${lastDate}</p>
    ${hasProgress ? `<button onclick="loadQuizProgress()">▶️ 繼續上次答題</button><br/><br/>` : ""}
    <label>選擇分類：
      <select id="categorySelect">
        <option value="all">全部分類</option>
        ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
      </select>
    </label><br/><br/>
    <label>題目數量：
      <input type="number" id="questionCount" min="1" max="${questions.length}" value="10">
    </label><br/><br/>
    <button onclick="startQuiz()">▶️ 開始答題</button>
    <button onclick="renderQuestionList()">📘 題庫總覽</button>
    <button onclick="renderWrongBook()">❌ 錯題本</button>
  `;
}

function startQuiz() {
  const selectedCategory = document.getElementById("categorySelect").value;
  const count = parseInt(document.getElementById("questionCount").value);
  filteredQuestions = selectedCategory === "all"
    ? [...questions]
    : questions.filter(q => q.category === selectedCategory);
  filteredQuestions = filteredQuestions.sort(() => Math.random() - 0.5).slice(0, count);
  currentQuestionIndex = 0;
  correctCount = 0;
  totalToAnswer = filteredQuestions.length;
  wrongBook = [];
  renderQuestion();
}

// 狀態：未答題=>已答題，控制切換
let answered = false;

function renderQuestion() {
  saveQuizProgress();
  const q = filteredQuestions[currentQuestionIndex];
  const progressPercent = Math.round((currentQuestionIndex / totalToAnswer) * 100);
  const progressColor = getProgressColor(progressPercent);

  let optionsHTML = q.options.map((opt, i) =>
    `<li>
      <button class="option-btn" id="opt${i}" onclick="checkAnswer('${String.fromCharCode(65+i)}')"
        >${String.fromCharCode(65+i)}. ${opt}</button>
    </li>`
  ).join("");

  app.innerHTML = `
    <div style="background:#e5e7eb;border-radius:8px;overflow:hidden;margin:10px 0;">
      <div style="width:${progressPercent}%;background:${progressColor};padding:4px 0;color:white;text-align:center;font-size:12px;transition:width 0.4s;">
        ${progressPercent}%
      </div>
    </div>
    <div>📘 分類：${q.category}　🔢 題號：${currentQuestionIndex + 1} / ${totalToAnswer}</div><br/>
    <p><strong>${q.question}</strong></p>
    <ul>${optionsHTML}</ul>
    <div id="feedback"></div><br/>
    <button onclick="stopQuiz()">🛑 返回首頁</button>
  `;

  answered = false;
}

function checkAnswer(selected) {
  if (answered) return;
  answered = true;
  const q = filteredQuestions[currentQuestionIndex];
  const correct = q.answer;
  const feedback = document.getElementById("feedback");

  // 鎖定所有選項
  q.options.forEach((_, i) => {
    let btn = document.getElementById("opt" + i);
    btn.disabled = true;
    if (selected === String.fromCharCode(65 + i)) {
      btn.style.border = selected === correct ? "2px solid #2563eb" : "2px solid #ef4444";
      btn.style.background = selected === correct ? "#dbeafe" : "#fee2e2";
    }
    // 正解上色
    if (String.fromCharCode(65 + i) === correct) {
      btn.style.fontWeight = "bold";
      btn.style.background = "#f0fdf4";
      btn.style.border = "2px solid #10b981";
    }
  });

  // 顯示回饋與解析
  if (selected === correct) {
    feedback.innerHTML = `✅ 答對了！<br>【解析】${q.explanation || '本題無解析'}`;
    correctCount++;
  } else {
    feedback.innerHTML = `❌ 答錯了，正確答案是 ${correct}<br>【解析】${q.explanation || '本題無解析'}`;
    wrongBook.push(q);
  }

  // 顯示「下一題」按鈕
  feedback.innerHTML += `<br><br><button onclick="nextQuestion()">下一題</button>`;
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < totalToAnswer) {
    renderQuestion();
  } else {
    clearQuizProgress();
    const score = Math.round((correctCount / totalToAnswer) * 100);
    localStorage.setItem("ai_quiz_last_score", score);
    localStorage.setItem("ai_quiz_last_date", new Date().toLocaleDateString());
    renderResult(score);
  }
}

function renderResult(score) {
  const grade = getGrade(score);
  app.innerHTML = `
    <h2>🎉 答題結束</h2>
    <p>✅ 共答對 ${correctCount} 題 / ${totalToAnswer} 題</p>
    <p>📊 分數：${score} 分</p>
    <p>🏅 評價等級：${grade.level}<br>${grade.msg}</p>
    <br/>
    <button onclick="renderStartScreen()">⬅️ 回首頁</button>
    <button onclick="renderWrongBook()">❌ 錯題本</button>
    <button onclick="retryWrongBook()">♻️ 錯題再挑戰</button>
  `;
}

function renderQuestionList() {
  app.innerHTML = `
    <h2>📘 題庫總覽</h2>
    <button onclick="renderStartScreen()">⬅️ 回首頁</button><br/><br/>
    <ul>
      ${questions.map(q => `
        <li>
          <div class="category-label">${q.category}</div>
          <strong>Q${q.id}：${q.question}</strong><br/>
          ${q.options.map((opt, i) => `<span>${String.fromCharCode(65+i)}. ${opt} </span>`).join(" / ")}<br/>
          ✅ 正解：${q.answer}<br/>
          🔎 解析：${q.explanation || '本題無解析'}<br/><br/>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderWrongBook() {
  if (wrongBook.length === 0) {
    app.innerHTML = `
      <h2>❌ 錯題本</h2>
      <p>目前沒有錯題紀錄 🎉</p>
      <button onclick="renderStartScreen()">⬅️ 回首頁</button>
    `;
    return;
  }
  app.innerHTML = `
    <h2>❌ 錯題本</h2>
    <button onclick="renderStartScreen()">⬅️ 回首頁</button>
    <button onclick="retryWrongBook()">♻️ 錯題再挑戰</button>
    <ul>
      ${wrongBook.map(q => `
        <li>
          <div class="category-label">${q.category}</div>
          <strong>Q${q.id}：${q.question}</strong><br/>
          ${q.options.map((opt, i) => `<span>${String.fromCharCode(65+i)}. ${opt} </span>`).join(" / ")}<br/>
          ✅ 正解：${q.answer}<br/>
          🔎 解析：${q.explanation || '本題無解析'}<br/><br/>
        </li>
      `).join("")}
    </ul>
  `;
}

function retryWrongBook() {
  if (wrongBook.length === 0) return;
  filteredQuestions = [...wrongBook];
  currentQuestionIndex = 0;
  correctCount = 0;
  totalToAnswer = wrongBook.length;
  wrongBook = [];
  renderQuestion();
}

function stopQuiz() {
  clearQuizProgress();
  renderStartScreen();
}
