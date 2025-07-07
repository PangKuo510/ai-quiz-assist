// ------- 新增: 順序練題入口與流程 -------
function renderStartScreen() {
  // ...（原本內容不變）
  app.innerHTML += `
    <br><button onclick="startSequentialQuiz()">📋 順序練題</button>
  `;
}

// 順序練題核心狀態
let sequentialMode = false;
let sequentialIndex = 0;
let sequentialUserAnswers = []; // 記錄每題用戶選過的答案

function startSequentialQuiz() {
  sequentialMode = true;
  sequentialIndex = 0;
  sequentialUserAnswers = Array(questions.length).fill(null);
  renderSequentialQuestion();
}

function renderSequentialQuestion() {
  const q = questions[sequentialIndex];
  let optionsHTML = q.options.map((opt, i) => {
    const optionChar = String.fromCharCode(65+i);
    let selected = sequentialUserAnswers[sequentialIndex] === optionChar;
    return `<li>
      <button class="option-btn" id="seq_opt${i}" 
        onclick="selectSequentialAnswer('${optionChar}')"
        ${selected ? 'style="font-weight:bold;background:#dbeafe;"' : ''}>
        ${optionChar}. ${opt}
      </button>
    </li>`;
  }).join("");

  app.innerHTML = `
    <div style="background:#e5e7eb;border-radius:8px;overflow:hidden;margin:10px 0;">
      <div style="width:${Math.round(((sequentialIndex+1)/questions.length)*100)}%;background:#2563eb;padding:4px 0;color:white;text-align:center;font-size:12px;">
        ${sequentialIndex+1} / ${questions.length}
      </div>
    </div>
    <div>📘 分類：${q.category}　🔢 題庫編號：Q${q.id}（第${sequentialIndex+1}題 / 共${questions.length}題）</div><br/>
    <p><strong>${q.question}</strong></p>
    <ul>${optionsHTML}</ul>
    <div id="seq_feedback"></div><br/>
    <button onclick="goSequentialPrev()">⬅️ 上一題</button>
    <button onclick="goSequentialNext()">➡️ 下一題</button>
    <input type="number" min="1" max="${questions.length}" id="seq_jump_input" style="width:60px;">
    <button onclick="goSequentialJump()">跳轉</button>
    <button onclick="stopQuiz()">🛑 返回首頁</button>
  `;

  // 若有選過答案，立即顯示解析
  if(sequentialUserAnswers[sequentialIndex]) showSequentialFeedback(sequentialUserAnswers[sequentialIndex]);
}

function selectSequentialAnswer(selected) {
  const q = questions[sequentialIndex];
  sequentialUserAnswers[sequentialIndex] = selected; // 記錄
  showSequentialFeedback(selected);
}

function showSequentialFeedback(selected) {
  const q = questions[sequentialIndex];
  const feedback = document.getElementById("seq_feedback");
  if(selected === q.answer){
    feedback.innerHTML = `✅ 答對了！<br>【解析】${q.explanation || '本題無解析'}`;
  }else{
    feedback.innerHTML = `❌ 答錯了，正確答案是 ${q.answer}<br>【解析】${q.explanation || '本題無解析'}<br>（可以再嘗試選其他答案）`;
  }
  // 鎖定所有已答選項 disable
  q.options.forEach((_, i) => {
    let btn = document.getElementById("seq_opt"+i);
    btn.disabled = (selected === q.answer); // 答對才 disable
  });
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
    // 結束時出現分數與評價
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
