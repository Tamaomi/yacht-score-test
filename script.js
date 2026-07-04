const MAX_PLAYERS = 8;
const PLAYER_COLORS = ["#ffd94f", "#b8d7ff", "#ffc0cb", "#bff0c0", "#d9c2ff", "#ffcf9e", "#c9f2f2", "#e5e5e5"];
const categories = [
  { key: "aces", label: "エース", icon: "⚀", upper: true },
  { key: "twos", label: "デュース", icon: "⚁", upper: true },
  { key: "threes", label: "トレイ", icon: "⚂", upper: true },
  { key: "fours", label: "フォー", icon: "⚃", upper: true },
  { key: "fives", label: "ファイブ", icon: "⚄", upper: true },
  { key: "sixes", label: "シックス", icon: "⚅", upper: true },
  { key: "choice", label: "チョイス", icon: "✣" },
  { key: "fourDice", label: "フォーダイス", icon: "▪▪▪▪" },
  { key: "fullHouse", label: "フルハウス", icon: "▪▪▪" },
  { key: "smallStraight", label: "S.ストレート", icon: "▚" },
  { key: "bigStraight", label: "B.ストレート", icon: "▦" },
  { key: "yacht", label: "ヨット", icon: "✤" }
];
let players = createInitialPlayers();
const table = document.getElementById("scoreTable");
const turnText = document.getElementById("turnText");
const playerCountText = document.getElementById("playerCountText");
const settingsDialog = document.getElementById("settingsDialog");

document.getElementById("addPlayerBtn").addEventListener("click", addPlayer);
document.getElementById("resetBtn").addEventListener("click", resetGame);
document.getElementById("settingsBtn").addEventListener("click", () => settingsDialog.showModal());

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

render();

function createInitialPlayers() {
  return [createPlayer(1), createPlayer(2)];
}

function createPlayer(number) {
  return { name: `P${number}`, color: PLAYER_COLORS[number - 1], scores: {} };
}

function addPlayer() {
  if (players.length >= MAX_PLAYERS) {
    alert("人数は最大8人までです。");
    return;
  }
  players.push(createPlayer(players.length + 1));
  render();
}

function resetGame() {
  if (!confirm("点数をすべてリセットしますか？")) return;
  players = createInitialPlayers();
  render();
}

function render() {
  table.innerHTML = "";
  table.appendChild(renderHeader());
  categories.slice(0, 6).forEach(category => table.appendChild(renderScoreRow(category)));
  table.appendChild(renderUpperSummaryRow());
  categories.slice(6).forEach(category => table.appendChild(renderScoreRow(category)));
  table.appendChild(renderTotalRow());
  updateTurnText();
  playerCountText.textContent = `${players.length}人`;
}

function renderHeader() {
  const tr = document.createElement("tr");
  tr.innerHTML = `<th class="roleHead">役名</th>`;
  players.forEach((player, index) => {
    const th = document.createElement("th");
    th.className = "playerHead";
    th.innerHTML = `<div class="playerBadge" style="background:${player.color}">${index + 1}</div>${player.name}`;
    tr.appendChild(th);
  });
  return tr;
}

function renderScoreRow(category) {
  const tr = document.createElement("tr");
  const role = document.createElement("td");
  role.className = "role";
  role.innerHTML = `<span class="roleIcon">${category.icon}</span>${category.label}`;
  tr.appendChild(role);

  players.forEach((player, playerIndex) => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.className = "scoreInput";
    input.inputMode = "numeric";
    input.pattern = "[0-9]*";
    input.maxLength = 3;
    input.value = player.scores[category.key] ?? "";
    input.setAttribute("aria-label", `${player.name} ${category.label}`);
    input.addEventListener("input", event => updateScore(event, playerIndex, category.key));
    input.addEventListener("blur", event => normalizeScore(event, playerIndex, category.key));
    if (input.value !== "") input.classList.add("used");
    td.appendChild(input);
    tr.appendChild(td);
  });
  return tr;
}

function updateScore(event, playerIndex, key) {
  const safeValue = event.target.value.replace(/[^0-9]/g, "").slice(0, 3);
  event.target.value = safeValue;
  players[playerIndex].scores[key] = safeValue;
  event.target.classList.toggle("used", safeValue !== "");
  updateCalculatedCells();
}

function normalizeScore(event, playerIndex, key) {
  if (event.target.value === "") {
    delete players[playerIndex].scores[key];
    render();
    return;
  }
  const number = Math.max(0, Math.min(999, Number(event.target.value)));
  players[playerIndex].scores[key] = String(number);
  render();
}

function renderUpperSummaryRow() {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td class="summaryLabel role">小計<br>ボーナス+35</td>`;
  players.forEach((player, index) => {
    const td = document.createElement("td");
    td.className = "summaryCell upperSummary";
    td.dataset.playerIndex = index;
    tr.appendChild(td);
  });
  return tr;
}

function renderTotalRow() {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td class="summaryLabel role">総合得点</td>`;
  players.forEach((player, index) => {
    const td = document.createElement("td");
    td.className = "totalCell totalScore";
    td.dataset.playerIndex = index;
    tr.appendChild(td);
  });
  setTimeout(updateCalculatedCells, 0);
  return tr;
}

function updateCalculatedCells() {
  document.querySelectorAll(".upperSummary").forEach(cell => {
    const player = players[Number(cell.dataset.playerIndex)];
    const upper = calcUpper(player);
    const bonus = upper >= 63 ? 35 : 0;
    cell.textContent = `${upper}/63${bonus ? " +35" : ""}`;
  });
  document.querySelectorAll(".totalScore").forEach(cell => {
    const player = players[Number(cell.dataset.playerIndex)];
    cell.textContent = calcTotal(player);
  });
  updateTurnText();
}

function calcUpper(player) {
  return categories.filter(c => c.upper).reduce((sum, c) => sum + readScore(player, c.key), 0);
}

function calcTotal(player) {
  const rawTotal = categories.reduce((sum, c) => sum + readScore(player, c.key), 0);
  return rawTotal + (calcUpper(player) >= 63 ? 35 : 0);
}

function readScore(player, key) {
  const value = Number(player.scores[key]);
  return Number.isFinite(value) ? value : 0;
}

function updateTurnText() {
  const maxFilled = Math.max(...players.map(player => Object.values(player.scores).filter(v => v !== "").length));
  const turn = Math.min(maxFilled + 1, categories.length);
  turnText.textContent = `ターン ${turn} / ${categories.length}`;
}
