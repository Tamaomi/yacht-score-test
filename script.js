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
const settingsDialog = document.getElementById('settingsDialog');
const settingsNames = document.getElementById('settingsNames');
const judgeButton = document.getElementById('judgeButton');
const resultDialog = document.getElementById('resultDialog');
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
  inputStatus.textContent = `${ROLES[state.currentRole].name}を入力中`;
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
      input.inputMode = 'numeric';
      input.min = '0';
      input.max = '999';
      input.value = score === null ? '' : String(score);
      input.dataset.player = p;
      input.dataset.role = roleIndex;
      input.setAttribute('aria-label', `${state.playerNames[p]} ${role.name}`);
      input.addEventListener('focus', selectCell);
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
}


function selectCell(event) {
  const player = Number(event.currentTarget.dataset.player);
  const roleIndex = Number(event.currentTarget.dataset.role);
  state.currentPlayer = player;
  state.currentRole = roleIndex;
  document.querySelectorAll('.score').forEach(cell => cell.classList.remove('active'));
  event.currentTarget.closest('.score').classList.add('active');
  inputStatus.textContent = `${ROLES[state.currentRole].name}を入力中`;
}

function saveCellScore(event) {
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

function showResult() {
  if (!isAllScoresFilled()) return;
  resultDialog.showModal();
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
document.getElementById('prevRoleButton').addEventListener('click', movePrevRole);
document.getElementById('nextRoleButton').addEventListener('click', moveNextRole);

document.getElementById('judgeButton').addEventListener('click', showResult);
document.getElementById('closeResultButton').addEventListener('click', () => resultDialog.close());
