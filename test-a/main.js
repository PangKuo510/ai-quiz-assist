let questions = [];
let filteredQuestions = [];
let wrongBook = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let totalToAnswer = 0;

const app = document.getElementById("root");

let noticeData = null;


// 星星（難度）圖案，importance：1~5
function getStars(n) {
  n = Math.max(1, Math.min(5, Number(n) || 1));
  return '<span class="star-group">' +
    "★★★★★".slice(0, n).split("").map(s=>`<span class="star-on">★</span>`).join("") +
    "★★★★★".slice(n, 5).split("").map(s=>`<span class="star-off">★</span>`).join("") +
    '</span>';
}

// 進度條四色分級
function getProgressColor(percent) {
  if (percent <= 25) return "#ef4444"; // 紅
  if (percent <= 50) return "#f59e0b"; // 橙
  if (percent <= 75) return "#fde047"; // 黃
  return "#2563eb"; // 藍
}

// 分數評價
function getGrade(score) {
  if (score >= 90) return {level:"S", msg:"表現優異，已具備出色的AI應用能力！"};
  if (score >= 75) return {level:"A", msg:"表現良好，請再加強細節可更進一步。"};
  if (score >= 60) return {level:"B", msg:"基本掌握，但尚有提升空間，加油！"};
  return {level:"C", msg:"建議加強基礎，持續努力會有進步！"};
}

// 載入公告與體庫
fetch("notice.json")
  .then(res => res.json())
  .then(data => {
    noticeData = data;
    // 題庫載入必須等公告載完，確保渲染時可用 noticeData
    return fetch("ai_question_bank_v3.json");
  })
  .then(res => {
    if (!res.ok) throw new Error("題庫載入失敗");
    return res.json();
  })
  .then(data => {
    // ...你原本的題庫格式自動mapping區段...
    questions = data.map(q => {
      if (typeof q.importance === "string") {
        const mapping = { "low": 1, "medium": 3, "high": 5 };
        q.importance = mapping[q.importance.toLowerCase()] || 1;
      }
      return q;
    });
    renderStartScreen();
  })
  .catch(err => {
    app.innerHTML = "<p style='color:red;'>🚫 資料載入失敗，請確認 notice.json 及 題庫 JSON 皆存在且格式正確。</p>";
  });

// ---------- 一般（隨機）練題 ----------

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
  sequentialMode = false;
  const lastScore = localStorage.getItem("ai_quiz_last_score") || "尚無紀錄";
  const lastDate = localStorage.getItem("ai_quiz_last_date") || "未曾練習";
  const hasProgress = localStorage.getItem("ai_quiz_saved_progress");
  const categories = [...new Set(questions.map(q => q.category))];
  
    // ⬇️ 新增這一段，根據 noticeData 組合布告欄
  let noticeHTML = "";
  if (noticeData && noticeData.list && noticeData.list.length) {
    noticeHTML = `
      <div class="notice-board">
        <strong>${noticeData.title || "📢 公告"}</strong>
        <ul>
          ${noticeData.list.map(item => {
            if (typeof item === "string" && item.startsWith("http")) {
              let linkText = item;
              if (item.includes("spreadsheets")) linkText = "👉 完整更新日誌";
              if (item.includes("forms")) linkText = "🐞 問題回報表單";
              return `<li><a href="${item}" target="_blank" style="color:#2563eb;text-decoration:underline;">${linkText}</a></li>`;
            } else {
              return `<li>${item}</li>`;
            }
          }).join("")}
        </ul>
      </div>
    `;
  }
  
  app.innerHTML = `
    <h1 style='color:#2563eb'>AI應用規劃師教練(測試版)</h1>
    <p>歡迎來到為 AI應用規劃師考照打造的每日練習工具</p>
    <p>請注意!本頁為新功能、新題庫測試版!</p>
      <p>
    正式版網頁為
    <a href="https://pangkuo510.github.io/ai-quiz-coach/" target="_blank" style="color:#2563eb;text-decoration:underline;">
      https://pangkuo510.github.io/ai-quiz-coach/
    </a>
  </p>
    ${noticeHTML}
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
    <div class="btn-panel">
      <div class="btn-row">
        <button class="main-btn" onclick="startQuiz()">▶️ 隨機練題</button>
      </div>
      <div class="btn-row btn-row-3">
        <button onclick="startSequentialQuiz()">📋 順序練題</button>
        <button onclick="renderQuestionList()">📘 題庫總覽</button>
        <button onclick="renderWrongBook()">❌ 錯題本</button>
      </div>
    </div>
  `;
}

function startQuiz() {
  sequentialMode = false;
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

let answered = false;

function renderQuestion() {
  saveQuizProgress();
  const q = filteredQuestions[currentQuestionIndex];
  const progressPercent = Math.round((currentQuestionIndex / totalToAnswer) * 100);
  const progressColor = getProgressColor(progressPercent);

  // 標籤與星星
  let tagHTML = q.tags && q.tags.length 
    ? q.tags.map(tag => `<span class="tag-label">${tag}</span>`).join("") 
    : "";
  let starsHTML = getStars(q.importance);

  let optionsHTML = q.options.map((opt, i) =>
    `<li>
      <button class="option-btn" id="opt${i}" onclick="checkAnswer('${String.fromCharCode(65+i)}')"
        >${String.fromCharCode(65+i)}. ${opt.replace(/^[A-D]\.\s*/,"")}</button>
    </li>`
  ).join("");

  app.innerHTML = `
    <div style="background:#e5e7eb;border-radius:8px;overflow:hidden;margin:10px 0;">
      <div style="width:${progressPercent}%;background:${progressColor};padding:4px 0;color:white;text-align:center;font-size:12px;transition:width 0.4s;">
        ${progressPercent}%
      </div>
    </div>
    <div>
      📘 分類：${q.category} ${starsHTML}
      <div style="margin:2px 0 5px 0">${tagHTML}</div>
      🔢 題號：${currentQuestionIndex + 1} / ${totalToAnswer}（題庫編號 Q${q.id}）
    </div><br/>
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

  // 標籤與星星
  let tagHTML = q.tags && q.tags.length 
    ? q.tags.map(tag => `<span class="tag-label">${tag}</span>`).join("") 
    : "";
  let starsHTML = getStars(q.importance);

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

  // 顯示回饋與解析＋tags
  if (selected === correct) {
    feedback.innerHTML = `✅ 答對了！<br>【解析】${q.explanation || '本題無解析'}`;
    correctCount++;
  } else {
    feedback.innerHTML = `❌ 答錯了，正確答案是 ${correct}<br>【解析】${q.explanation || '本題無解析'}`;
    wrongBook.push(q);
  }
  feedback.innerHTML += `<div style="margin-top:8px;">${tagHTML}</div>`;

  // 顯示「下一題」按鈕
  feedback.innerHTML += `<br><button onclick="nextQuestion()">下一題</button>`;
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
    <h2>🎉 隨機練題結束</h2>
    <p>✅ 共答對 ${correctCount} 題 / ${totalToAnswer} 題</p>
    <p>📊 分數：${score} 分</p>
    <p>🏅 評價等級：${grade.level}<br>${grade.msg}</p>
    <br/>
    <button onclick="renderStartScreen()">⬅️ 回首頁</button>
    <button onclick="renderWrongBook()">❌ 錯題本</button>
    <button onclick="retryWrongBook()">♻️ 錯題再挑戰</button>
  `;
}

// ---------- 順序練題 ----------

let sequentialMode = false;
let sequentialIndex = 0;
let sequentialUserAnswers = [];

function startSequentialQuiz() {
  sequentialMode = true;
  sequentialIndex = 0;
  sequentialUserAnswers = Array(questions.length).fill(null);
  renderSequentialQuestion();
}

function renderSequentialQuestion() {
  const q = questions[sequentialIndex];
  let tagHTML = q.tags && q.tags.length 
    ? q.tags.map(tag => `<span class="tag-label">${tag}</span>`).join("") 
    : "";
  let starsHTML = getStars(q.importance);

  let optionsHTML = q.options.map((opt, i) => {
    const optionChar = String.fromCharCode(65+i);
    let isSelected = sequentialUserAnswers[sequentialIndex] === optionChar;
    return `<li>
      <button class="option-btn" id="seq_opt${i}" 
        onclick="selectSequentialAnswer('${optionChar}')"
        ${isSelected && optionChar === q.answer ? 'style="font-weight:bold;background:#f0fdf4;border:2px solid #10b981;" disabled' : ''}
        ${isSelected && optionChar !== q.answer ? 'style="font-weight:bold;background:#fee2e2;border:2px solid #ef4444;"' : ''}>
        ${optionChar}. ${opt.replace(/^[A-D]\.\s*/,"")}
      </button>
    </li>`;
  }).join("");

  app.innerHTML = `
    <div style="background:#e5e7eb;border-radius:8px;overflow:hidden;margin:10px 0;">
      <div style="width:${Math.round(((sequentialIndex+1)/questions.length)*100)}%;background:${getProgressColor(Math.round(((sequentialIndex+1)/questions.length)*100))};padding:4px 0;color:white;text-align:center;font-size:12px;">
        ${sequentialIndex+1} / ${questions.length}
      </div>
    </div>
    <div>
      📘 分類：${q.category} ${starsHTML}
      <div style="margin:2px 0 5px 0">${tagHTML}</div>
      🔢 題庫編號：Q${q.id}（第${sequentialIndex+1}題 / 共${questions.length}題）
    </div><br/>
    <p><strong>${q.question}</strong></p>
    <ul>${optionsHTML}</ul>
    <div id="seq_feedback"></div><br/>
    <div class="btn-row btn-row-3">
      <button onclick="goSequentialPrev()">⬅️ 上一題</button>
      <button onclick="goSequentialNext()">➡️ 下一題</button>
      <input type="number" min="1" max="${questions.length}" id="seq_jump_input" style="width:60px;" placeholder="題號">
      <button onclick="goSequentialJump()">跳轉</button>
      <button onclick="stopQuiz()">🛑 返回首頁</button>
    </div>
  `;

  if(sequentialUserAnswers[sequentialIndex]) showSequentialFeedback(sequentialUserAnswers[sequentialIndex]);
}

function selectSequentialAnswer(selected) {
  const q = questions[sequentialIndex];
  sequentialUserAnswers[sequentialIndex] = selected;
  showSequentialFeedback(selected);
}

function showSequentialFeedback(selected) {
  const q = questions[sequentialIndex];
  const feedback = document.getElementById("seq_feedback");
  let tagHTML = q.tags && q.tags.length 
    ? q.tags.map(tag => `<span class="tag-label">${tag}</span>`).join("") 
    : "";

  if(selected === q.answer){
    feedback.innerHTML = `✅ 答對了！<br>【解析】${q.explanation || '本題無解析'}`;
    q.options.forEach((_, i) => {
      let btn = document.getElementById("seq_opt"+i);
      btn.disabled = true;
      if (String.fromCharCode(65 + i) === q.answer) {
        btn.style.fontWeight = "bold";
        btn.style.background = "#f0fdf4";
        btn.style.border = "2px solid #10b981";
      }
    });
  }else{
    feedback.innerHTML = `❌ 答錯了，正確答案是 ${q.answer}<br>【解析】${q.explanation || '本題無解析'}<br>（可以再嘗試選其他答案）`;
    q.options.forEach((_, i) => {
      let btn = document.getElementById("seq_opt"+i);
      if (String.fromCharCode(65 + i) === selected) btn.disabled = true;
    });
  }
  feedback.innerHTML += `<div style="margin-top:8px;">${tagHTML}</div>`;
}

function goSequentialPrev() {
  if(sequentialIndex > 0){
    sequentialIndex--;
    renderSequentialQuestion();
  }
}
function goSequentialNext() {
  if(sequentialIndex < questions.length - 1){
    sequentialIndex++;
    renderSequentialQuestion();
  }else{
    showSequentialResult();
  }
}
function goSequentialJump() {
  const jumpNum = parseInt(document.getElementById("seq_jump_input").value);
  if(jumpNum >=1 && jumpNum <= questions.length){
    sequentialIndex = jumpNum - 1;
    renderSequentialQuestion();
  }
}
function showSequentialResult() {
  let correct = sequentialUserAnswers.filter((a, idx) => a && a === questions[idx].answer).length;
  let total = questions.length;
  let score = Math.round((correct / total) * 100);
  const grade = getGrade(score);
  app.innerHTML = `
    <h2>📋 順序練題結束</h2>
    <p>✅ 共答對 ${correct} 題 / ${total} 題</p>
    <p>📊 分數：${score} 分</p>
    <p>🏅 評價等級：${grade.level}<br>${grade.msg}</p>
    <button onclick="renderStartScreen()">⬅️ 回首頁</button>
    <button onclick="startSequentialQuiz()">♻️ 重新順序練題</button>
  `;
  sequentialMode = false;
}

// ---------- 其他原有功能 ----------

function renderQuestionList() {
  app.innerHTML = `
    <h2>📘 題庫總覽</h2>
    <button onclick="renderStartScreen()">⬅️ 回首頁</button><br/><br/>
    <ul>
      ${questions.map(q => `
        <li>
          <div class="category-label">${q.category}</div>
          <span>${getStars(q.importance)}</span>
          <div style="margin-top:2px;">${q.tags && q.tags.length ? q.tags.map(tag => `<span class="tag-label">${tag}</span>`).join("") : ""}</div>
          <strong>Q${q.id}：${q.question}</strong><br/>
          ${q.options.map((opt, i) => `<span>${String.fromCharCode(65+i)}. ${opt.replace(/^[A-D]\.\s*/,"")} </span>`).join(" / ")}<br/>
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
          <span>${getStars(q.importance)}</span>
          <div style="margin-top:2px;">${q.tags && q.tags.length ? q.tags.map(tag => `<span class="tag-label">${tag}</span>`).join("") : ""}</div>
          <strong>Q${q.id}：${q.question}</strong><br/>
          ${q.options.map((opt, i) => `<span>${String.fromCharCode(65+i)}. ${opt.replace(/^[A-D]\.\s*/,"")} </span>`).join(" / ")}<br/>
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
