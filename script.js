'use strict';

const MAX_PLAYERS = 8;
const MIN_PLAYERS = 2;
const PLAYER_COLORS = ['#ffe98a', '#d9eefb', '#ffc6cf', '#cfeecb', '#e6d7ff', '#ffd8a8', '#ccefe8', '#eeeeee'];
const AVATARS = ['👩', '👨‍💼', '👩‍🦰', '👨', '🧑', '👩‍💼', '🧔', '🙂'];

const roles = [
  { key: 'aces', name: 'エース', short: '⚀', section: 'upper' },
  { key: 'twos', name: 'デュース', short: '⚁', section: 'upper' },
  { key: 'threes', name: 'トレイ', short: '⚂', section: 'upper' },
  { key: 'fours', name: 'フォー', short: '⚃', section: 'upper' },
  { key: 'fives', name: 'ファイブ', short: '⚄', section: 'upper' },
  { key: 'sixes', name: 'シックス', short: '⚅', section: 'upper' },
  { key: 'choice', name: 'チョイス', short: '✣', section: 'lower' },
  { key: 'fourDice', name: 'フォーダイス', short: '⚄', section: 'lower' },
  { key: 'fullHouse', name: 'フルハウス', short: '▦', section: 'lower' },
  { key: 'smallStraight', name: 'S.ストレート', short: '⚂', section: 'lower' },
  { key: 'bigStraight', name: 'B.ストレート', short: '⚃', section: 'lower' },
  { key: 'yacht', name: 'ヨット', short: '⚅', section: 'lower' }
];

const scoreLimits = {
  aces: 5, twos: 10, threes: 15, fours: 20, fives: 25, sixes: 30,
  choice: 30, fourDice: 30, fullHouse: 25, smallStraight: 15, bigStraight: 30, yacht: 50
};

let state = createInitialState();

const el = {
  screenTitle: document.getElementById('screenTitle'),
  mainScreen: document.getElementById('mainScreen'),
  listScreen: document.getElementById('listScreen'),
  backButton: document.getElementById('backButton'),
  settingsButton: document.getElementById('settingsButton'),
  turnNow: document.getElementById('turnNow'),
  playerCardA: document.getElementById('playerCardA'),
  playerCardB: document.getElementById('playerCardB'),
  upperTable: document.getElementById('upperTable'),
  lowerTable: document.getElementById('lowerTable'),
  totalRow: document.getElementById('totalRow'),
  prevPlayerButton: document.getElementById('prevPlayerButton'),
  nextPlayerButton: document.getElementById('nextPlayerButton'),
  addPlayerButton: document.getElementById('addPlayerButton'),
  listButton: document.getElementById('listButton'),
  resetButton: document.getElementById('resetButton'),
  allScoreTable: document.getElementById('allScoreTable'),
  homeButton: document.getElementById('homeButton'),
  settingsDialog: document.getElementById('settingsDialog'),
  settingsPlayerList: document.getElementById('settingsPlayerList'),
  saveSettingsButton: document.getElementById('saveSettingsButton')
};

function createInitialState() {
  return {
    turn: 1,
    currentPlayer: 0,
    players: Array.from({ length: 4 }, (_, index) => createPlayer(index))
  };
}

function createPlayer(index) {
  return {
    name: `プレイヤー${index + 1}`,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    avatar: AVATARS[index % AVATARS.length],
    scores: Object.fromEntries(roles.map(role => [role.key, '']))
  };
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  return String(Math.max(min, Math.min(max, Math.floor(number))));
}

function getVisiblePlayerIndexes() {
  const first = state.currentPlayer % 2 === 0 ? state.currentPlayer : state.currentPlayer - 1;
  return [first, first + 1].filter(index => index < state.players.length);
}

function calculatePlayer(player) {
  const upper = roles.filter(r => r.section === 'upper').reduce((sum, role) => sum + Number(player.scores[role.key] || 0), 0);
  const bonus = upper >= 63 ? 35 : 0;
  const lower = roles.filter(r => r.section === 'lower').reduce((sum, role) => sum + Number(player.scores[role.key] || 0), 0);
  return { upper, bonus, lower, total: upper + bonus + lower };
}

function render() {
  el.turnNow.textContent = state.turn;
  renderPlayerCards();
  renderScoreTables();
  renderAllScoreTable();
}

function renderPlayerCards() {
  const visible = getVisiblePlayerIndexes();
  [el.playerCardA, el.playerCardB].forEach((card, position) => {
    const playerIndex = visible[position];
    if (playerIndex === undefined) {
      card.innerHTML = '';
      card.style.background = '#fff';
      return;
    }
    const player = state.players[playerIndex];
    card.style.background = playerIndex === state.currentPlayer ? player.color : '#fff';
    card.innerHTML = `
      <div>
        <span class="player-label">プレイヤー</span>
        <div class="player-count">${playerIndex + 1} / ${state.players.length}</div>
        <span class="player-name-chip" style="background:${player.color}">${escapeHtml(player.name)}</span>
      </div>
      <div class="avatar" style="background:${player.color}">${player.avatar}</div>
    `;
  });
}

function renderScoreTables() {
  const visible = getVisiblePlayerIndexes();
  el.upperTable.innerHTML = roles.filter(r => r.section === 'upper').map(role => createScoreRow(role, visible)).join('') + createSummaryRow('小計', visible, 'upper') + createSummaryRow('ボーナス（+35）', visible, 'bonus');
  el.lowerTable.innerHTML = roles.filter(r => r.section === 'lower').map(role => createScoreRow(role, visible)).join('');
  el.totalRow.innerHTML = `<div>総合得点</div>${visible.map(index => `<div class="total-score">${calculatePlayer(state.players[index]).total}</div>`).join('')}`;

  document.querySelectorAll('.score-cell').forEach(input => {
    input.addEventListener('input', onScoreInput);
    input.addEventListener('focus', event => event.target.classList.add('focused-cell'));
    input.addEventListener('blur', event => event.target.classList.remove('focused-cell'));
  });
}

function createScoreRow(role, visible) {
  return `<div class="score-row">
    <div class="role-name"><span class="dice">${role.short}</span><span>${role.name}</span></div>
    ${visible.map(index => {
      const player = state.players[index];
      const isActive = index === state.currentPlayer ? 'active-player-cell' : '';
      return `<div class="${isActive}"><input class="score-cell" inputmode="numeric" pattern="[0-9]*" data-player="${index}" data-role="${role.key}" value="${player.scores[role.key]}" aria-label="${player.name} ${role.name}"></div>`;
    }).join('')}
  </div>`;
}

function createSummaryRow(label, visible, type) {
  return `<div class="score-row">
    <div class="summary-label">${label}</div>
    ${visible.map(index => {
      const calc = calculatePlayer(state.players[index]);
      const value = type === 'upper' ? `${calc.upper} / 63` : calc.bonus;
      return `<div class="summary-cell">${value}</div>`;
    }).join('')}
  </div>`;
}

function onScoreInput(event) {
  const input = event.target;
  const playerIndex = Number(input.dataset.player);
  const roleKey = input.dataset.role;
  const cleanValue = clampNumber(input.value.replace(/[^0-9]/g, ''), 0, scoreLimits[roleKey]);
  input.value = cleanValue;
  state.players[playerIndex].scores[roleKey] = cleanValue;
  render();
  const nextInput = document.querySelector(`[data-player="${playerIndex}"][data-role="${roleKey}"]`);
  if (nextInput) {
    nextInput.focus();
    nextInput.classList.add('focused-cell');
    const length = nextInput.value.length;
    nextInput.setSelectionRange(length, length);
  }
}

function renderAllScoreTable() {
  el.allScoreTable.style.setProperty('--player-count', state.players.length);
  const header = `<div class="all-row all-head"><div>役</div>${state.players.map(player => `<div style="background:${player.color}"><div><div>${escapeHtml(player.name)}</div><div class="avatar">${player.avatar}</div></div></div>`).join('')}</div>`;
  const roleRows = roles.map(role => `<div class="all-row"><div class="dice">${role.short}</div>${state.players.map(player => `<div>${player.scores[role.key] || 0}</div>`).join('')}</div>`).join('');
  const upperRow = `<div class="all-row"><div>小計</div>${state.players.map(player => `<div>${calculatePlayer(player).upper}</div>`).join('')}</div>`;
  const bonusRow = `<div class="all-row"><div>ボーナス</div>${state.players.map(player => `<div>${calculatePlayer(player).bonus}</div>`).join('')}</div>`;
  const lowerRow = `<div class="all-row"><div>下段小計</div>${state.players.map(player => `<div>${calculatePlayer(player).lower}</div>`).join('')}</div>`;
  const totalRow = `<div class="all-row"><div>総合得点</div>${state.players.map(player => `<div class="all-total">${calculatePlayer(player).total}</div>`).join('')}</div>`;
  el.allScoreTable.innerHTML = header + roleRows + upperRow + bonusRow + lowerRow + totalRow;
}

function showScreen(screenName) {
  const isList = screenName === 'list';
  el.mainScreen.classList.toggle('active', !isList);
  el.listScreen.classList.toggle('active', isList);
  el.backButton.classList.toggle('hidden', !isList);
  el.settingsButton.classList.toggle('hidden', isList);
  el.screenTitle.textContent = isList ? '全員のスコア一覧' : '🎲 ヨット点数表';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function movePlayer(direction) {
  state.currentPlayer += direction;
  if (state.currentPlayer < 0) state.currentPlayer = state.players.length - 1;
  if (state.currentPlayer >= state.players.length) {
    state.currentPlayer = 0;
    state.turn = Math.min(12, state.turn + 1);
  }
  render();
}

function addPlayer() {
  if (state.players.length >= MAX_PLAYERS) {
    alert('人数は最大8人までです。');
    return;
  }
  state.players.push(createPlayer(state.players.length));
  render();
}

function resetGame() {
  if (!confirm('全員の点数をリセットします。よろしいですか？')) return;
  const count = state.players.length;
  state = createInitialState();
  while (state.players.length < count) state.players.push(createPlayer(state.players.length));
  render();
  showScreen('main');
}

function openSettings() {
  el.settingsPlayerList.innerHTML = state.players.map((player, index) => `
    <div class="setting-player">
      <label>名前${index + 1}<input type="text" maxlength="12" data-setting-name="${index}" value="${escapeHtml(player.name)}"></label>
      <label>色<input type="color" data-setting-color="${index}" value="${toHexColor(player.color)}"></label>
    </div>
  `).join('');
  el.settingsDialog.showModal();
}

function saveSettings() {
  document.querySelectorAll('[data-setting-name]').forEach(input => {
    const index = Number(input.dataset.settingName);
    state.players[index].name = input.value.trim() || `プレイヤー${index + 1}`;
  });
  document.querySelectorAll('[data-setting-color]').forEach(input => {
    const index = Number(input.dataset.settingColor);
    state.players[index].color = input.value;
  });
  el.settingsDialog.close();
  render();
}

function toHexColor(color) {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#eeeeee';
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }
}

el.prevPlayerButton.addEventListener('click', () => movePlayer(-1));
el.nextPlayerButton.addEventListener('click', () => movePlayer(1));
el.addPlayerButton.addEventListener('click', addPlayer);
el.listButton.addEventListener('click', () => showScreen('list'));
el.homeButton.addEventListener('click', () => showScreen('main'));
el.backButton.addEventListener('click', () => showScreen('main'));
el.resetButton.addEventListener('click', resetGame);
el.settingsButton.addEventListener('click', openSettings);
el.saveSettingsButton.addEventListener('click', saveSettings);

registerServiceWorker();
render();
