// 色選択状態を管理
let selectedColor = 'red';
const colorBtns = document.querySelectorAll('.color-btn');
colorBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    colorBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedColor = btn.dataset.color;
    highlightValidCells(); // 色選択時に点滅マスを更新
  });
});
colorBtns[0].classList.add('selected');

// 盤面生成
const board = document.getElementById('board');
const cells = [];
const history = [];
const size = 5;

function updateColorCounts() {
  const counts = { red: 0, blue: 0, green: 0, white: 0 };
  cells.forEach(cell => {
    const color = cell.dataset.color;
    if (counts[color] !== undefined) counts[color]++;
  });
  document.getElementById('count-red').textContent = counts.red;
  document.getElementById('count-blue').textContent = counts.blue;
  document.getElementById('count-green').textContent = counts.green;
  document.getElementById('count-white').textContent = counts.white;
}

function setCellColor(cell, color) {
  // アタックチャンスで消されたマスは黄色で表示
  if (color === '' && cell.classList.contains('attack-chance-removed')) {
    cell.style.background = '#fffbe0';
    cell.style.border = '2px solid #ffd600';
    cell.dataset.color = '';
    // 黄色枠は維持
    return;
  }
  cell.style.background = color === 'white' ? 'white' : color;
  cell.style.border = '2px solid #111';
  cell.dataset.color = color;
  // 通常の色が塗られたらアタックチャンス黄色を解除
  if (color && cell.classList.contains('attack-chance-removed')) {
    cell.classList.remove('attack-chance-removed');
    cell.style.boxShadow = '';
  }
}

function getCellIdx(row, col) {
  return row * size + col;
}

function getCellColor(row, col) {
  if (row < 0 || row >= size || col < 0 || col >= size) return null;
  return cells[getCellIdx(row, col)].dataset.color;
}

function flipLine(row, col, dRow, dCol, color) {
  let r = row + dRow;
  let c = col + dCol;
  const toFlip = [];
  while (r >= 0 && r < size && c >= 0 && c < size) {
    const idx = getCellIdx(r, c);
    const cellColor = cells[idx].dataset.color;
    if (!cellColor || cellColor === color) break;
    toFlip.push(idx);
    r += dRow;
    c += dCol;
  }
  // 最後が自分の色なら挟めている
  if (toFlip.length > 0 && getCellColor(r, c) === color) {
    toFlip.forEach(idx => {
      history.push({ idx, prev: cells[idx].dataset.color });
      setCellColor(cells[idx], color);
    });
  }
}

// flip-config.jsonからリズム間隔を取得
let flipIntervalMs = 120;
fetch('src/js/flip-config.json')
  .then(res => res.json())
  .then(cfg => { if(cfg.flipIntervalMs) flipIntervalMs = cfg.flipIntervalMs; });

// アニメーション付きで1方向を塗る
async function flipLineAnimated(row, col, dRow, dCol, color) {
  let r = row + dRow;
  let c = col + dCol;
  const toFlip = [];
  while (r >= 0 && r < size && c >= 0 && c < size) {
    const idx = getCellIdx(r, c);
    const cellColor = cells[idx].dataset.color;
    if (!cellColor || cellColor === color) break;
    toFlip.push(idx);
    r += dRow;
    c += dCol;
  }
  if (toFlip.length > 0 && getCellColor(r, c) === color) {
    for (let i = 0; i < toFlip.length; i++) {
      await new Promise(res => setTimeout(res, flipIntervalMs));
      const idx = toFlip[i];
      history.push({ idx, prev: cells[idx].dataset.color });
      setCellColor(cells[idx], color);
      updateColorCounts();
    }
  }
}

function canFlip(row, col, color) {
  if (getCellColor(row, col)) return false;
  const dirs = [
    [0, 1], [1, 0], [0, -1], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];
  for (const [dr, dc] of dirs) {
    let r = row + dr;
    let c = col + dc;
    let foundOther = false;
    while (r >= 0 && r < size && c >= 0 && c < size) {
      const cellColor = getCellColor(r, c);
      if (!cellColor || cellColor === color) break;
      foundOther = true;
      r += dr;
      c += dc;
      if (getCellColor(r, c) === color && foundOther) return true;
    }
  }
  return false;
}

function hasAnyFlippable(color) {
  for (let i = 0; i < size * size; i++) {
    const row = Math.floor(i / size);
    const col = i % size;
    if (canFlip(row, col, color)) return true;
  }
  return false;
}

function isAdjacentToColor(row, col, color) {
  const dirs = [
    [0, 1], [1, 0], [0, -1], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];
  for (const [dr, dc] of dirs) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < size && c >= 0 && c < size) {
      if (getCellColor(r, c) === color) return true;
    }
  }
  return false;
}

function canFlipNextTurn(row, col, color) {
  if (getCellColor(row, col)) return false;
  // 仮にこのマスをcolorで塗った場合の盤面をシミュレート
  const tempColors = cells.map(cell => cell.dataset.color);
  tempColors[getCellIdx(row, col)] = color;
  // その後、他の色で挟めるマスができるか
  for (const otherColor of ['red', 'blue', 'green', 'white']) {
    if (otherColor === color) continue;
    for (let i = 0; i < size * size; i++) {
      const r = Math.floor(i / size);
      const c = i % size;
      if (tempColors[i]) continue;
      if (canFlipSimulated(r, c, otherColor, tempColors)) return true;
    }
  }
  return false;
}

function canBeSandwichedNext(row, col, color) {
  // そのマスが空でなければ不可
  if (getCellColor(row, col)) return false;
  // 盤面上に他の色が1つ以上あるか
  const otherColorsOnBoard = ['red', 'blue', 'green', 'white'].filter(c => c !== color && cells.some(cell => cell.dataset.color === c));
  if (otherColorsOnBoard.length === 0) return false;
  // 仮にこのマスをotherColorで塗った場合、次の手でcolorで挟めるか
  for (const otherColor of otherColorsOnBoard) {
    const tempColors = cells.map(cell => cell.dataset.color);
    tempColors[getCellIdx(row, col)] = otherColor;
    // 仮想盤面上でcolorで挟めるマスが1つでもあればOK
    for (let i = 0; i < size * size; i++) {
      const r = Math.floor(i / size);
      const c = i % size;
      if (tempColors[i]) continue;
      if (canFlipSimulated(r, c, color, tempColors)) return true;
    }
  }
  return false;
}

function canBeSandwichedNextStrict(row, col, color) {
  // そのマスが空でなければ不可
  if (getCellColor(row, col)) return false;
  // 盤面上に他の色が1つ以上あるか
  const otherColorsOnBoard = ['red', 'blue', 'green', 'white'].filter(c => c !== color && cells.some(cell => cell.dataset.color === c));
  if (otherColorsOnBoard.length === 0) return false;
  // 仮にこのマスをcolorで塗った場合、さらに次の手でcolorで塗って既存の別の色を1つ以上挟めるか
  const dirs = [
    [0, 1], [1, 0], [0, -1], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];
  // 仮想盤面1: このマスをcolorで塗る
  const tempColors1 = cells.map(cell => cell.dataset.color);
  tempColors1[getCellIdx(row, col)] = color;
  // 仮想盤面2: その次の手でcolorで塗れる全てのマスを調べる
  for (let i = 0; i < size * size; i++) {
    if (tempColors1[i]) continue;
    const r = Math.floor(i / size);
    const c = i % size;
    // そのマスでcolorで既存の別の色を1つ以上挟めるか
    for (const [dr, dc] of dirs) {
      let rr = r + dr;
      let cc = c + dc;
      let foundOther = false;
      while (rr >= 0 && rr < size && cc >= 0 && cc < size) {
        const idx = getCellIdx(rr, cc);
        const cellColor = tempColors1[idx];
        if (!cellColor || cellColor === color) break;
        foundOther = true;
        rr += dr;
        cc += dc;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size && tempColors1[getCellIdx(rr, cc)] === color && foundOther) {
          return true;
        }
      }
    }
  }
  return false;
}

function highlightValidCells() {
  const isAllEmpty = cells.every(cell => !cell.dataset.color);
  const isColorOnBoard = cells.some(cell => cell.dataset.color === selectedColor);
  const isOtherColorOnBoard = cells.some(cell => cell.dataset.color && cell.dataset.color !== selectedColor);
  cells.forEach((cell, i) => {
    cell.classList.remove('can-place');
    const row = Math.floor(i / size);
    const col = i % size;
    if (isAllEmpty) {
      if (i === 12) cell.classList.add('can-place');
    } else if (canFlip(row, col, selectedColor)) {
      cell.classList.add('can-place');
    } else if (!hasAnyFlippable(selectedColor) && !getCellColor(row, col) && isAdjacentToColor(row, col, selectedColor)) {
      cell.classList.add('can-place');
    } else if (!isColorOnBoard && isOtherColorOnBoard && canBeSandwichedNextStrict(row, col, selectedColor)) {
      cell.classList.add('can-place');
    }
  });
}

// 盤面生成
for (let i = 0; i < size * size; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.innerHTML = `<span>${i + 1}</span>`;
  cell.dataset.color = '';
  cell.addEventListener('click', function () {
    if (attackChanceActive) return; // アタックチャンス中は通常操作不可
    // can-placeのマスのみ塗れる
    if (cell.dataset.color !== selectedColor && cell.classList.contains('can-place')) {
      history.push({ idx: i, prev: cell.dataset.color });
      setCellColor(cell, selectedColor);
      const row = Math.floor(i / size);
      const col = i % size;
      const dirs = [
        [0, 1], [1, 0], [0, -1], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];
      dirs.forEach(([dr, dc]) => flipLine(row, col, dr, dc, selectedColor));
      updateColorCounts();
      highlightValidCells();
      checkAttackChance();
      // アタックチャンス発動条件
      if (isAttackChance) {
        setTimeout(() => enableAttackChance(), 300);
      }
    }
    // もしアタックチャンスで消されたマス（黄色）を再度取る場合は黄色を解除
    if (cell.classList.contains('attack-chance-removed')) {
      cell.classList.remove('attack-chance-removed');
      cell.style.boxShadow = '';
    }
  });
  board.appendChild(cell);
  cells.push(cell);
}

updateColorCounts();
highlightValidCells();

// 全クリア
const clearBtn = document.getElementById('clearBtn');
clearBtn.addEventListener('click', () => {
  cells.forEach(cell => setCellColor(cell, ''));
  updateColorCounts();
  highlightValidCells();
  history.length = 0;
  isAttackChance = false;
  attackChanceActive = false;
  lastRemovedCellIdx = null;
  attackChanceTriggered = false;
});

// やり直し
const undoBtn = document.getElementById('undoBtn');
undoBtn.addEventListener('click', () => {
  if (history.length > 0) {
    const last = history.pop();
    setCellColor(cells[last.idx], last.prev || '');
    updateColorCounts();
    highlightValidCells();
  }
});

let currentQuizAnswer = '';

// クイズデータを外部ファイルから取得
async function getQuizFromConfig(category, difficulty) {
  const res = await fetch('./quiz-data.json');
  const data = await res.json();
  const quiz = data.quizzes.find(q => q.category === category && q.difficulty === difficulty);
  currentQuizAnswer = quiz ? quiz.answer : '';
  return quiz ? quiz.question : 'クイズを生成できませんでした';
}

// クイズ生成ボタンの処理
const quizCategory = document.getElementById('quiz-category');
const quizDifficulty = document.getElementById('quiz-difficulty');
const quizArea = document.getElementById('quiz-area');
const generateQuizBtn = document.getElementById('generateQuizBtn');
if (generateQuizBtn) {
  generateQuizBtn.addEventListener('click', async () => {
    const category = quizCategory.value;
    const difficulty = quizDifficulty.value;
    quizArea.innerHTML = '<span>生成中...</span>';
    // 外部設定ファイルから取得
    const quiz = await getQuizFromConfig(category, difficulty);
    quizArea.innerHTML = `<span>${quiz}</span>`;
    // 答えボタンを有効化
    if (showAnswerBtn) showAnswerBtn.disabled = false;
  });
}

// 答えを表示ボタンの処理
const showAnswerBtn = document.getElementById('showAnswerBtn');
if (showAnswerBtn) {
  showAnswerBtn.disabled = true;
  showAnswerBtn.addEventListener('click', () => {
    if (currentQuizAnswer) {
      quizArea.innerHTML += `<div class='quiz-answer'><b>答え：</b>${currentQuizAnswer}</div>`;
      showAnswerBtn.disabled = true;
    }
  });
}

// クイズ作成ページへ遷移
const createQuizPageBtn = document.getElementById('createQuizPageBtn');
if (createQuizPageBtn) {
  createQuizPageBtn.addEventListener('click', () => {
    window.location.href = './create-quiz.html';
  });
}

// 盤面保存・復元
const saveBoardBtn = document.getElementById('saveBoardBtn');
const loadBoardBtn = document.getElementById('loadBoardBtn');
if (saveBoardBtn) {
  saveBoardBtn.addEventListener('click', () => {
    const boardState = cells.map(cell => cell.dataset.color);
    localStorage.setItem('othello-board', JSON.stringify(boardState));
    alert('盤面を保存しました');
  });
}
if (loadBoardBtn) {
  loadBoardBtn.addEventListener('click', () => {
    const boardState = JSON.parse(localStorage.getItem('othello-board') || '[]');
    if (boardState.length === size * size) {
      boardState.forEach((color, i) => setCellColor(cells[i], color));
      updateColorCounts();
      highlightValidCells();
      alert('盤面を復元しました');
    } else {
      alert('保存データがありません');
    }
  });
}

// アタックチャンス用フラグ・履歴
let isAttackChance = false;
let attackChanceActive = false;
let lastRemovedCellIdx = null;
let attackChanceTriggered = false; // 追加: 1回だけ発動用

function checkAttackChance() {
  // 残り4マスになった瞬間にアタックチャンス発動（1回だけ）
  const emptyCount = cells.filter(cell => !cell.dataset.color).length;
  if (!attackChanceTriggered && emptyCount === 4) {
    isAttackChance = true;
    attackChanceTriggered = true;
  }
}

// アタックチャンスメッセージ表示
function showAttackChanceMessage() {
  const msg = document.getElementById('attack-chance-inline-msg');
  if (msg) {
    msg.textContent = 'アタックチャンスはどこにしますか？既存のマスを1つ選択してください';
    msg.style.display = 'inline';
  }
}
function hideAttackChanceMessage() {
  const msg = document.getElementById('attack-chance-inline-msg');
  if (msg) {
    msg.textContent = '';
    msg.style.display = 'none';
  }
}

function highlightAttackableCells() {
  cells.forEach(cell => {
    cell.classList.remove('attack-chance-target');
    // 選択時は黄色で囲わない
    if (cell.dataset.color) {
      cell.classList.add('attack-chance-target');
      cell.style.boxShadow = '';
      cell.style.cursor = 'pointer';
    }
  });
}

function clearAttackableHighlight() {
  cells.forEach(cell => {
    cell.classList.remove('attack-chance-target');
    cell.style.boxShadow = '';
    cell.style.cursor = '';
  });
}

// アタックチャンスマスを取ったときに3回点滅
async function blinkAttackChance(cell) {
  for (let i = 0; i < 3; i++) {
    cell.classList.remove('attack-chance-removed');
    await new Promise(res => setTimeout(res, 180));
    cell.classList.add('attack-chance-removed');
    await new Promise(res => setTimeout(res, 180));
  }
  cell.classList.add('attack-chance-removed');
}

function enableAttackChance() {
  attackChanceActive = true;
  showAttackChanceMessage();
  highlightAttackableCells();
  // 既存の色付きマスを選択可能に
  cells.forEach((cell, idx) => {
    if (cell.dataset.color) {
      cell.addEventListener('click', attackChanceHandler);
      cell.dataset.attackChanceIdx = idx;
    }
  });
}

function disableAttackChance() {
  attackChanceActive = false;
  hideAttackChanceMessage();
  clearAttackableHighlight();
  // イベント解除
  cells.forEach(cell => {
    cell.removeEventListener('click', attackChanceHandler);
    delete cell.dataset.attackChanceIdx;
  });
}

function attackChanceHandler(e) {
  if (!attackChanceActive) return;
  const cell = e.currentTarget;
  const idx = Number(cell.dataset.attackChanceIdx);
  if (!cell.dataset.color) return;
  // 確認メッセージ
  if (window.confirm('このマスを消しますか？')) {
    lastRemovedCellIdx = idx;
    setCellColor(cell, '');
    cell.classList.add('attack-chance-removed');
    // 3回点滅させてから黄色枠を残す
    blinkAttackChance(cell);
    disableAttackChance();
    updateColorCounts();
    highlightValidCells();
    // 1回だけ発動
    isAttackChance = false;
  }
}

// 盤面クリア時や復元時もアタックチャンス状態をリセット
clearBtn.addEventListener('click', () => {
  cells.forEach(cell => setCellColor(cell, ''));
  updateColorCounts();
  highlightValidCells();
  history.length = 0;
  isAttackChance = false;
  attackChanceActive = false;
  lastRemovedCellIdx = null;
  attackChanceTriggered = false;
});
if (loadBoardBtn) {
  loadBoardBtn.addEventListener('click', () => {
    const boardState = JSON.parse(localStorage.getItem('othello-board') || '[]');
    if (boardState.length === size * size) {
      boardState.forEach((color, i) => setCellColor(cells[i], color));
      updateColorCounts();
      highlightValidCells();
      alert('盤面を復元しました');
    } else {
      alert('保存データがありません');
    }
    isAttackChance = false;
    attackChanceActive = false;
    lastRemovedCellIdx = null;
    attackChanceTriggered = false;
  });
}
