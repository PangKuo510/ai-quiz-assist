
let questions = [];
let filteredQuestions = [];
let wrongBook = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let totalToAnswer = 0;

const app = document.getElementById("root");

// 載入題庫資料
fetch("ai_question_bank_v1_fixed.json")
  .then(function(res) {
    if (!res.ok) throw new Error("題庫載入失敗");
    return res.json();
  })
  .then(function(data) {
    console.log("✅ 題庫載入成功，共", data.length, "題");
    questions = data;
    renderStartScreen();
  })
  .catch(function(err) {
    console.error("❌ 題庫讀取錯誤：", err);
    app.innerHTML = "<p style='color:red;'>🚫 題庫載入失敗，請稍後重試。</p>";
  });

// 其餘題目處理函式保持原樣：從先前版本 cleaned_main_js_v8 剔除錯誤段落後補上即可



function saveQuizProgress() {
  const state = {
    filteredQuestions,
    currentQuestionIndex,
    correctCount,
    totalToAnswer
  };
  localStorage.setItem("ai_quiz_saved_progress", JSON.stringify(state));
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
  filteredQuestions = selectedCategory === "all" ? [...questions] : questions.filter(q => q.category === selectedCategory);
  filteredQuestions = filteredQuestions.sort(() => Math.random() - 0.5).slice(0, count);
  currentQuestionIndex = 0;
  correctCount = 0;
  totalToAnswer = filteredQuestions.length;
  wrongBook = [];
  renderQuestion();
}

function renderQuestion() {
  saveQuizProgress();
  let q = filteredQuestions[currentQuestionIndex];
  const progressPercent = Math.round((currentQuestionIndex / totalToAnswer) * 100);
  const progressColor = progressPercent < 40 ? '#ef4444' : progressPercent < 70 ? '#f59e0b' : '#10b981';
  const progressBar = `
    <div style="background:#e5e7eb;border-radius:8px;overflow:hidden;margin:10px 0;">
      <div style="width:${progressPercent}%;background:${progressColor};padding:4px 0;color:white;text-align:center;font-size:12px;">
        ${progressPercent}%
      </div>
    </div>`;
  saveQuizProgress();
  q = filteredQuestions[currentQuestionIndex];
  app.innerHTML = `
  
    <div>📘 分類：${q.category}　🔢 題號：${currentQuestionIndex + 1} / ${totalToAnswer}</div><br/>
    <p><strong>${q.question}</strong></p>
    <ul>
      ${q.options.map((opt, i) => `<li><button onclick="checkAnswer('${String.fromCharCode(65+i)}')">${String.fromCharCode(65+i)}. ${opt}</button></li>`).join("")}
    </ul>
    <div id="feedback"></div><br/>
    <button onclick="stopQuiz()">🛑 停止答題並返回首頁</button>
  `;
}

let answering = false;
function checkAnswer(selected) {
  if (answering) return;
  answering = true;
  q = filteredQuestions[currentQuestionIndex];
  const correct = q.answer;
  const feedback = document.getElementById("feedback");

  if (selected === correct) {
    feedback.innerHTML = "✅ 答對了！";
    correctCount++;
  } else {
    feedback.innerHTML = `❌ 答錯了，正確答案是 ${correct}`;
    wrongBook.push(q);
  }

  currentQuestionIndex++;
  setTimeout(() => { answering = false;
    if (currentQuestionIndex < totalToAnswer) {
      renderQuestion();
    } else {
      clearQuizProgress();
      const score = Math.round((correctCount / totalToAnswer) * 100);
      localStorage.setItem("ai_quiz_last_score", score);
      localStorage.setItem("ai_quiz_last_date", new Date().toLocaleDateString());
      renderResult(score);
    }
  }, 800);
}

function renderResult(score) {
  app.innerHTML = `
  
    <h2>🎉 答題結束</h2>
    <p>✅ 共答對 ${correctCount} 題 / ${totalToAnswer} 題</p>
    <p>📊 分數：${score} 分</p><br/>
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
          ✅ 正解：${q.answer}<br/><br/>
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
          ✅ 正解：${q.answer}<br/><br/>
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



fetch("ai_question_bank_v1_fixed.json")
  .then(function(res) {
    if (!res.ok) throw new Error("題庫載入失敗");
    return res.json();
  })
  .then(function(data) {
    console.log("✅ 題庫載入成功，共", data.length, "題");
    questions = data;
    renderStartScreen();
  })
  .catch(function(err) {
    console.error("❌ 題庫讀取錯誤：", err);
    document.getElementById("root").innerHTML = "<p style='color:red;'>🚫 題庫載入失敗，請稍後重試。</p>";
  });
