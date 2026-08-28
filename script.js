const PLAYER_COLORS = ['#1268d8', '#ef4775', '#2db455', '#ff9024'];
const ROLES = [
  { id: 'aces', name: 'エース', mark: '⚀', section: 'upper' },
  { id: 'twos', name: 'デュース', mark: '⚁', section: 'upper' },
  { id: 'threes', name: 'トレイ', mark: '⚂', section: 'upper' },
  { id: 'fours', name: 'フォー', mark: '⚃', section: 'upper' },
  { id: 'fives', name: 'ファイブ', mark: '⚄', section: 'upper' },
  { id: 'sixes', name: 'シックス', mark: '⚅', section: 'upper' },
  // 修正内容：下段役のアイコンを添付デザインに近いドット配置へ変更
  { id: 'choice', name: 'チョイス', markClass: 'choice-icon', section: 'lower' },
  { id: 'fourcard', name: 'フォーダイス', markClass: 'fourdice-icon', section: 'lower' },
  { id: 'fullhouse', name: 'フルハウス', markClass: 'fullhouse-icon', section: 'lower' },
  { id: 'smallstraight', name: 'S.ストレート', markClass: 'smallstraight-icon', section: 'lower' },
  { id: 'bigstraight', name: 'B.ストレート', markClass: 'bigstraight-icon', section: 'lower' },
  { id: 'yacht', name: 'ヨット', markClass: 'yacht-icon', section: 'lower' }
];

// 修正内容：ダイス選択式点数計算機能で使う役ごとの得点定義
const UPPER_FACE_VALUES = { aces: 1, twos: 2, threes: 3, fours: 4, fives: 5, sixes: 6 };
const FIXED_SCORES = { smallstraight: 15, bigstraight: 30, yacht: 50 };

const state = {
  playerCount: 2,
  playerNames: ['P1', 'P2', 'P3', 'P4'],
  scores: {},
  currentRole: 0,
  currentPlayer: 0,
  inputMode: 'direct',
  selectedDice: []
};

const scoreBoard = document.getElementById('scoreBoard');
const nameRow = document.getElementById('nameRow');
const turnTitle = document.getElementById('turnTitle');
const modeTabs = document.getElementById('modeTabs');
const settingsDialog = document.getElementById('settingsDialog');
const settingsNames = document.getElementById('settingsNames');
const judgeButton = document.getElementById('judgeButton');
const resultDialog = document.getElementById('resultDialog');
const directInputModeButton = document.getElementById('directInputModeButton');
const diceInputModeButton = document.getElementById('diceInputModeButton');
const diceCalculator = document.getElementById('diceCalculator');
// 修正内容：スコア入力はポップアップを使わず、表のセル内inputへ直接入力する

function initScores() {
  state.scores = {};
  for (let p = 0; p < 4; p++) {
    state.scores[p] = {};
    ROLES.forEach(role => state.scores[p][role.id] = null);
  }
}

function getTurn() {
  return Math.min(state.currentRole + 1, ROLES.length);
}

function valueOf(score) {
  const value = Number(score);
  return Number.isFinite(value) ? value : 0;
}

function upperSubtotal(playerIndex) {
  return ROLES.filter(r => r.section === 'upper').reduce((sum, role) => sum + valueOf(state.scores[playerIndex][role.id]), 0);
}

function lowerSubtotal(playerIndex) {
  return ROLES.filter(r => r.section === 'lower').reduce((sum, role) => sum + valueOf(state.scores[playerIndex][role.id]), 0);
}

function bonus(playerIndex) {
  return upperSubtotal(playerIndex) >= 63 ? 35 : 0;
}

function total(playerIndex) {
  return upperSubtotal(playerIndex) + lowerSubtotal(playerIndex) + bonus(playerIndex);
}

// 修正内容：ダイス選択式点数計算機能の選択・計算・確定処理
function activeRole() {
  return ROLES[state.currentRole] || ROLES[0];
}

function activeScoreIsFilled() {
  const role = activeRole();
  return state.scores[state.currentPlayer][role.id] !== null;
}

function isValidDie(value) {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

function clearDice(shouldRender = true) {
  state.selectedDice = [];
  if (shouldRender) renderDiceCalculator();
}

function addDie(value) {
  if (!isValidDie(value) || state.selectedDice.length >= 5 || activeScoreIsFilled()) return;
  state.selectedDice.push(value);
  renderDiceCalculator();
}

function removeDie(index) {
  if (!Number.isInteger(index) || index < 0 || index >= state.selectedDice.length) return;
  state.selectedDice.splice(index, 1);
  renderDiceCalculator();
}

function diceTotal(dice = state.selectedDice) {
  return dice.reduce((sum, value) => sum + (isValidDie(value) ? value : 0), 0);
}

function faceCounts(dice = state.selectedDice) {
  const counts = [0, 0, 0, 0, 0, 0];
  dice.forEach(value => {
    if (isValidDie(value)) counts[value - 1] += 1;
  });
  return counts;
}

function calculateScore(role = activeRole(), dice = state.selectedDice) {
  const validDice = dice.filter(isValidDie);
  const totalValue = diceTotal(validDice);

  if (UPPER_FACE_VALUES[role.id]) {
    const face = UPPER_FACE_VALUES[role.id];
    return validDice.filter(value => value === face).reduce((sum, value) => sum + value, 0);
  }
  if (role.id === 'choice') return totalValue;

  const counts = faceCounts(validDice);
  if (role.id === 'fourcard') {
    return validDice.length === 5 && counts.some(count => count >= 4) ? totalValue : 0;
  }
  if (role.id === 'fullhouse') {
    const sortedCounts = counts.filter(Boolean).sort((a, b) => a - b);
    return validDice.length === 5 && sortedCounts.length === 2 && sortedCounts[0] === 2 && sortedCounts[1] === 3 ? totalValue : 0;
  }
  return FIXED_SCORES[role.id] || 0;
}

function dieFaceHtml(value) {
  const face = isValidDie(value) ? value : 1;
  return `<span class="die-face face-${face}" aria-hidden="true"><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span></span>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function setInputMode(mode) {
  if (!['direct', 'dice'].includes(mode)) return;
  state.inputMode = mode;
  // 修正内容：ダイス選択式点数計算機能で下段役までスクロール選択できるように調整
  document.body.classList.toggle('dice-input-mode', mode === 'dice');
  clearDice(false);
  directInputModeButton.classList.toggle('active', mode === 'direct');
  diceInputModeButton.classList.toggle('active', mode === 'dice');
  directInputModeButton.setAttribute('aria-pressed', String(mode === 'direct'));
  diceInputModeButton.setAttribute('aria-pressed', String(mode === 'dice'));
  renderBoard();
}

function confirmCalculatedScore(score) {
  const role = activeRole();
  if (state.inputMode !== 'dice' || activeScoreIsFilled() || !Number.isInteger(score) || score < 0 || score > 999) return;
  state.scores[state.currentPlayer][role.id] = score;
  clearDice(false);
  moveNext();
  renderBoard();
}

function confirmDiceScore() {
  const role = activeRole();
  const score = calculateScore(role);
  // 修正内容：ダイス選択式点数計算機能の上段役は1個から得点を確定できるように調整
  const requiredDice = UPPER_FACE_VALUES[role.id] ? 1 : 5;
  if (state.selectedDice.length < requiredDice || score <= 0) return;
  confirmCalculatedScore(score);
}

function confirmZeroScore() {
  confirmCalculatedScore(0);
}

function renderDiceCalculator() {
  if (state.inputMode !== 'dice') {
    diceCalculator.hidden = true;
    diceCalculator.innerHTML = '';
    return;
  }

  const role = activeRole();
  const playerName = escapeHtml(state.playerNames[state.currentPlayer] || `P${state.currentPlayer + 1}`);
  diceCalculator.hidden = false;

  if (activeScoreIsFilled()) {
    diceCalculator.innerHTML = `<p class="calculator-locked">${playerName} の「${role.name}」は入力済みです。空欄のスコアを選択してください。</p>`;
    return;
  }

  const fixedScore = FIXED_SCORES[role.id];
  if (fixedScore) {
    diceCalculator.innerHTML = `
      <div class="calculator-header"><h2>ダイス計算</h2><span class="dice-count">固定得点</span></div>
      <p class="calculator-target">${playerName} ／ ${role.name}</p>
      <!-- 修正内容：ダイス選択式点数計算機能の固定役入力を簡潔に表示 -->
      <div class="fixed-score-options">
        <button class="fixed-score-confirm" type="button" data-fixed-score="${fixedScore}">${fixedScore}点を入力</button>
        <button class="fixed-score-zero" type="button" data-zero-score>0点として入力</button>
      </div>`;
    diceCalculator.querySelector('[data-fixed-score]').addEventListener('click', event => confirmCalculatedScore(Number(event.currentTarget.dataset.fixedScore)));
    diceCalculator.querySelector('[data-zero-score]').addEventListener('click', confirmZeroScore);
    return;
  }

  const totalValue = diceTotal();
  const score = calculateScore(role);
  const isUpperRole = Boolean(UPPER_FACE_VALUES[role.id]);
  const canConfirm = (isUpperRole ? state.selectedDice.length >= 1 : state.selectedDice.length === 5) && score > 0;
  // 修正内容：ダイス選択式点数計算機能の表示をコンパクトに整理
  const selectedDiceHtml = Array.from({ length: 5 }, (_, index) => {
    const value = state.selectedDice[index];
    return isValidDie(value)
      ? `<button class="selected-die-button" type="button" data-selected-die="${index}" aria-label="${value}のダイスを削除">${dieFaceHtml(value)}</button>`
      : '<span class="selected-die-placeholder" aria-hidden="true"></span>';
  }).join('');
  const choicesHtml = [1, 2, 3, 4, 5, 6].map(value => `<button class="die-choice-button" type="button" data-die-value="${value}" aria-label="${value}のダイスを追加"${state.selectedDice.length >= 5 ? ' disabled' : ''}>${dieFaceHtml(value)}</button>`).join('');
  // 修正内容：ダイス選択式点数計算機能の得点をダイス入力エリア上部へ表示
  const scoreSummary = state.selectedDice.length === 0
    ? '<p class="calculator-summary is-empty" aria-hidden="true">&nbsp;</p>'
    : isUpperRole
      ? `<p class="calculator-summary"><span>得点</span> <strong>${score}点</strong></p>`
      : `<p class="calculator-summary"><span>合計</span> <strong>${totalValue}点</strong>${state.selectedDice.length === 5 && score > 0 ? ` <span>得点</span> <strong>${score}点</strong>` : ''}</p>`;

  diceCalculator.innerHTML = `
    <div class="calculator-header calculator-score-header">
      <div class="calculator-title-block"><h2>ダイス計算</h2><p class="calculator-target">${playerName} ／ ${role.name}</p></div>
      ${scoreSummary}
      <span class="dice-count">${state.selectedDice.length} / 5</span>
    </div>
    <div class="selected-dice-list" aria-label="選択したダイス">${selectedDiceHtml}</div>
    <div class="dice-choice-grid" aria-label="追加するダイス">${choicesHtml}</div>
    <div class="calculator-actions">
      <button class="calculator-confirm-button" type="button" data-confirm-dice${canConfirm ? '' : ' disabled'}>この点数を入力</button>
      <button class="calculator-zero-button" type="button" data-zero-score>0点として入力</button>
    </div>`;

  diceCalculator.querySelectorAll('[data-selected-die]').forEach(button => button.addEventListener('click', event => removeDie(Number(event.currentTarget.dataset.selectedDie))));
  diceCalculator.querySelectorAll('[data-die-value]').forEach(button => button.addEventListener('click', event => addDie(Number(event.currentTarget.dataset.dieValue))));
  diceCalculator.querySelector('[data-confirm-dice]').addEventListener('click', confirmDiceScore);
  diceCalculator.querySelector('[data-zero-score]').addEventListener('click', confirmZeroScore);
}

// 修正内容：現在選択中の人数について、全プレイヤーの全役が入力済みか判定
function isAllScoresFilled() {
  for (let p = 0; p < state.playerCount; p++) {
    for (const role of ROLES) {
      if (state.scores[p][role.id] === null) return false;
    }
  }
  return true;
}

function createCell(className, html) {
  const cell = document.createElement('div');
  cell.className = `cell ${className}`;
  cell.innerHTML = html;
  return cell;
}

// 修正内容：役アイコンをCSSで描画できるようにHTMLを分岐
function roleIconHtml(role) {
  if (role.markClass) return `<span class="dice lower-dice ${role.markClass}" aria-hidden="true"></span>`;
  return `<span class="dice" aria-hidden="true">${role.mark}</span>`;
}

function renderNames() {
  nameRow.innerHTML = '';
}


function renderBoard() {
  turnTitle.textContent = `ターン ${getTurn()} / 12`;
  renderNames();

  const grid = document.createElement('div');
  grid.className = `score-grid count-${state.playerCount}`;
  grid.appendChild(createCell('role header-role', '役名'));
  for (let p = 0; p < state.playerCount; p++) {
    const header = createCell('player-header', state.playerNames[p]);
    header.style.background = `linear-gradient(180deg, ${PLAYER_COLORS[p]}, ${PLAYER_COLORS[p]}dd)`;
    grid.appendChild(header);
  }

  ROLES.forEach((role, roleIndex) => {
    grid.appendChild(createCell('role', `${roleIconHtml(role)}<span class="role-name">${role.name}</span>`));
    for (let p = 0; p < state.playerCount; p++) {
      const score = state.scores[p][role.id];
      const scoreCell = createCell('score', '');
      if (p === state.currentPlayer) scoreCell.classList.add('current-player');
      if (roleIndex === state.currentRole && p === state.currentPlayer) scoreCell.classList.add('active');
      if (score !== null && roleIndex < state.currentRole) scoreCell.classList.add('filled-near');

      const input = document.createElement('input');
      input.className = 'score-input';
      input.type = 'number';
      input.inputMode = state.inputMode === 'dice' ? 'none' : 'numeric';
      input.min = '0';
      input.max = '999';
      input.readOnly = state.inputMode === 'dice';
      input.value = score === null ? '' : String(score);
      input.dataset.player = p;
      input.dataset.role = roleIndex;
      input.setAttribute('aria-label', `${state.playerNames[p]} ${role.name}`);
      input.addEventListener('focus', selectCell);
      if (state.inputMode === 'dice') input.addEventListener('click', selectCell);
      input.addEventListener('change', saveCellScore);
      input.addEventListener('keydown', handleScoreKey);
      scoreCell.appendChild(input);
      grid.appendChild(scoreCell);
    }

    if (role.id === 'sixes') {
      grid.appendChild(createCell('role', '小計'));
      for (let p = 0; p < state.playerCount; p++) grid.appendChild(createCell('summary', `<strong>${upperSubtotal(p)}</strong> / 63`));
      grid.appendChild(createCell('role', 'ボーナス +35'));
      for (let p = 0; p < state.playerCount; p++) grid.appendChild(createCell('summary', String(bonus(p))));
    }
  });

  grid.appendChild(createCell('role total-label', '総合得点'));
  for (let p = 0; p < state.playerCount; p++) grid.appendChild(createCell('total', String(total(p))));

  scoreBoard.innerHTML = '';
  scoreBoard.appendChild(grid);
  judgeButton.hidden = !isAllScoresFilled();
  renderDiceCalculator();
}


function selectCell(event) {
  const player = Number(event.currentTarget.dataset.player);
  const roleIndex = Number(event.currentTarget.dataset.role);
  const targetChanged = state.currentPlayer !== player || state.currentRole !== roleIndex;
  state.currentPlayer = player;
  state.currentRole = roleIndex;
  document.querySelectorAll('.score').forEach(cell => {
    cell.classList.remove('active');
    const input = cell.querySelector('.score-input');
    cell.classList.toggle('current-player', input && Number(input.dataset.player) === player);
  });
  event.currentTarget.closest('.score').classList.add('active');
  if (state.inputMode === 'dice' && targetChanged) clearDice(false);
  if (state.inputMode === 'dice') renderDiceCalculator();
}

function saveCellScore(event) {
  if (state.inputMode !== 'direct') return;
  const input = event.currentTarget;
  const player = Number(input.dataset.player);
  const roleIndex = Number(input.dataset.role);
  const role = ROLES[roleIndex];
  const raw = input.value.trim();

  state.currentPlayer = player;
  state.currentRole = roleIndex;

  if (raw === '') {
    state.scores[player][role.id] = null;
    renderBoard();
    return;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 999) {
    alert('0〜999の整数で入力してください。');
    input.value = state.scores[player][role.id] === null ? '' : String(state.scores[player][role.id]);
    return;
  }

  state.scores[player][role.id] = value;
  moveNext();
  renderBoard();
}

function handleScoreKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.currentTarget.blur();
  }
}


function moveNext() {
  if (state.currentPlayer < state.playerCount - 1) {
    state.currentPlayer += 1;
    return;
  }
  if (state.currentRole < ROLES.length - 1) {
    state.currentPlayer = 0;
    state.currentRole += 1;
  }
}

function setPlayerCount(count) {
  if (![2,3,4].includes(count)) return;
  state.playerCount = count;
  state.currentPlayer = Math.min(state.currentPlayer, count - 1);
  clearDice(false);
  document.querySelectorAll('#modeTabs button').forEach(button => {
    button.classList.toggle('active', Number(button.dataset.count) === count);
  });
  renderBoard();
}

function openSettings() {
  settingsNames.innerHTML = '';
  for (let p = 0; p < state.playerCount; p++) {
    const row = document.createElement('div');
    row.className = 'setting-row';
    row.innerHTML = `<label for="name${p}">プレイヤー${p + 1}</label><input id="name${p}" maxlength="8" value="${state.playerNames[p].replaceAll('"', '&quot;')}">`;
    settingsNames.appendChild(row);
  }
  settingsDialog.showModal();
}

function saveSettings() {
  for (let p = 0; p < state.playerCount; p++) {
    const input = document.getElementById(`name${p}`);
    const name = input.value.trim();
    state.playerNames[p] = name || `P${p + 1}`;
  }
  settingsDialog.close();
  renderBoard();
}

function showResult() {
  if (!isAllScoresFilled()) return;
  resultDialog.showModal();
}

function resetGame() {
  if (!confirm('すべての点数をリセットします。よろしいですか？')) return;
  initScores();
  state.currentRole = 0;
  state.currentPlayer = 0;
  clearDice(false);
  settingsDialog.close();
  renderBoard();
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
  }
}

initScores();
renderBoard();
registerServiceWorker();
modeTabs.addEventListener('click', event => {
  const button = event.target.closest('button[data-count]');
  if (button) setPlayerCount(Number(button.dataset.count));
});
// 修正内容：ダイス選択式点数計算機能の入力方式切り替え
directInputModeButton.addEventListener('click', () => setInputMode('direct'));
diceInputModeButton.addEventListener('click', () => setInputMode('dice'));
document.getElementById('menuButton').addEventListener('click', () => modeTabs.classList.toggle('open'));
document.getElementById('settingsButton').addEventListener('click', openSettings);
document.getElementById('saveSettingsButton').addEventListener('click', saveSettings);
document.getElementById('resetButton').addEventListener('click', resetGame);

document.getElementById('judgeButton').addEventListener('click', showResult);
document.getElementById('closeResultButton').addEventListener('click', () => resultDialog.close());

