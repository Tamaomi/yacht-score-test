const PLAYER_COLORS = ['#1268d8', '#ef4775', '#2db455', '#ff9024'];
const ROLES = [
  { id: 'aces', name: 'エース', mark: '⚀', section: 'upper' },
  { id: 'twos', name: 'デュース', mark: '⚁', section: 'upper' },
  { id: 'threes', name: 'トレイ', mark: '⚂', section: 'upper' },
  { id: 'fours', name: 'フォー', mark: '⚃', section: 'upper' },
  { id: 'fives', name: 'ファイブ', mark: '⚄', section: 'upper' },
  { id: 'sixes', name: 'シックス', mark: '⚅', section: 'upper' },
  { id: 'choice', name: 'チョイス', mark: '▦', section: 'lower' },
  { id: 'fourcard', name: 'フォーカード', mark: '▦', section: 'lower' },
  { id: 'fullhouse', name: 'フルハウス', mark: '▤', section: 'lower' },
  { id: 'smallstraight', name: 'S.ストレート', mark: '▱', section: 'lower' },
  { id: 'bigstraight', name: 'B.ストレート', mark: '▱', section: 'lower' },
  { id: 'yacht', name: 'ヨット', mark: '▥', section: 'lower' }
];

const state = {
  playerCount: 2,
  playerNames: ['P1', 'P2', 'P3', 'P4'],
  scores: {},
  currentRole: 0,
  currentPlayer: 0
};

const scoreBoard = document.getElementById('scoreBoard');
const nameRow = document.getElementById('nameRow');
const turnTitle = document.getElementById('turnTitle');
const inputStatus = document.getElementById('inputStatus');
const modeTabs = document.getElementById('modeTabs');
const scoreDialog = document.getElementById('scoreDialog');
const scoreDialogTitle = document.getElementById('scoreDialogTitle');
const scoreInput = document.getElementById('scoreInput');
const scoreError = document.getElementById('scoreError');
const settingsDialog = document.getElementById('settingsDialog');
const settingsNames = document.getElementById('settingsNames');
let editing = null;

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

function createCell(className, html) {
  const cell = document.createElement('div');
  cell.className = `cell ${className}`;
  cell.innerHTML = html;
  return cell;
}

function renderNames() {
  nameRow.className = `name-row count-${state.playerCount}`;
  nameRow.innerHTML = '';
  for (let p = 0; p < state.playerCount; p++) {
    const name = document.createElement('div');
    name.className = 'player-name';
    name.style.background = `linear-gradient(180deg, ${PLAYER_COLORS[p]}, ${PLAYER_COLORS[p]}dd)`;
    name.textContent = state.playerNames[p];
    nameRow.appendChild(name);
  }
}

function renderBoard() {
  turnTitle.textContent = `ターン ${getTurn()} / 12`;
  inputStatus.textContent = `${ROLES[state.currentRole].name}を入力中`;
  renderNames();

  const grid = document.createElement('div');
  grid.className = `score-grid count-${state.playerCount}`;
  grid.appendChild(createCell('role header-role', '役名'));
  for (let p = 0; p < state.playerCount; p++) grid.appendChild(createCell('header', ''));

  ROLES.forEach((role, roleIndex) => {
    grid.appendChild(createCell('role', `<span class="dice">${role.mark}</span><span>${role.name}</span>`));
    for (let p = 0; p < state.playerCount; p++) {
      const score = state.scores[p][role.id];
      const scoreCell = createCell('score', score === null ? '' : String(score));
      if (p === state.currentPlayer) scoreCell.classList.add('current-player');
      if (roleIndex === state.currentRole && p === state.currentPlayer) scoreCell.classList.add('active');
      if (score !== null && roleIndex < state.currentRole) scoreCell.classList.add('filled-near');
      scoreCell.dataset.player = p;
      scoreCell.dataset.role = roleIndex;
      scoreCell.addEventListener('click', openScoreDialog);
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
}

function openScoreDialog(event) {
  const player = Number(event.currentTarget.dataset.player);
  const roleIndex = Number(event.currentTarget.dataset.role);
  editing = { player, roleIndex };
  const role = ROLES[roleIndex];
  const currentValue = state.scores[player][role.id];
  scoreDialogTitle.textContent = `${state.playerNames[player]}：${role.name}`;
  scoreInput.value = currentValue === null ? '' : currentValue;
  scoreError.textContent = '';
  scoreDialog.showModal();
  setTimeout(() => scoreInput.focus(), 50);
}

function saveScore() {
  if (!editing) return;
  const raw = scoreInput.value.trim();
  if (raw === '') {
    scoreError.textContent = '0以上の数字を入力してください。';
    return;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 999) {
    scoreError.textContent = '0〜999の整数で入力してください。';
    return;
  }
  const role = ROLES[editing.roleIndex];
  state.scores[editing.player][role.id] = value;
  state.currentPlayer = editing.player;
  state.currentRole = editing.roleIndex;
  moveNext();
  scoreDialog.close();
  renderBoard();
}

function clearScore() {
  if (!editing) return;
  const role = ROLES[editing.roleIndex];
  state.scores[editing.player][role.id] = null;
  scoreDialog.close();
  renderBoard();
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

function movePrevRole() {
  if (state.currentRole > 0) {
    state.currentRole -= 1;
    state.currentPlayer = 0;
  }
  renderBoard();
}

function moveNextRole() {
  if (state.currentRole < ROLES.length - 1) {
    state.currentRole += 1;
    state.currentPlayer = 0;
  }
  renderBoard();
}

function setPlayerCount(count) {
  if (![2,3,4].includes(count)) return;
  state.playerCount = count;
  state.currentPlayer = Math.min(state.currentPlayer, count - 1);
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

function resetGame() {
  if (!confirm('すべての点数をリセットします。よろしいですか？')) return;
  initScores();
  state.currentRole = 0;
  state.currentPlayer = 0;
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
document.getElementById('menuButton').addEventListener('click', () => modeTabs.classList.toggle('open'));
document.getElementById('settingsButton').addEventListener('click', openSettings);
document.getElementById('saveSettingsButton').addEventListener('click', saveSettings);
document.getElementById('resetButton').addEventListener('click', resetGame);
document.getElementById('saveScoreButton').addEventListener('click', saveScore);
document.getElementById('clearScoreButton').addEventListener('click', clearScore);
document.getElementById('prevRoleButton').addEventListener('click', movePrevRole);
document.getElementById('nextRoleButton').addEventListener('click', moveNextRole);
scoreInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveScore();
  }
});
