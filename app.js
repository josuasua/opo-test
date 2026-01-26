/* Opos Test - Dropdown multi-selección (ordenado por test numérico) */
const $ = (id) => document.getElementById(id);

const state = {
  all: [],
  pool: [],
  quiz: [],
  idx: 0,
  answers: new Map(),       // id -> "A"/"B"/"C"/"D"
  optionOrder: new Map(),   // id -> ["A","B","C","D"] barajado
  lastWrong: [],
  // mapa test -> label "Test X · Tema"
  testLabel: new Map(),
  config: {
    numQuestions: 20,
    penalty: 0.333,
    selectedTests: [],      // [] => todos
    shuffleOptions: true
  }
};

const HIST_KEY = "opos_test_hist_v1";

/* ----------------------------
   Utils
---------------------------- */

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toIntOrNull(v) {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

/* ----------------------------
   Histórico
---------------------------- */

function loadHist() {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY) || '{"attempts":0,"avg":null,"last":null}');
  } catch {
    return { attempts: 0, avg: null, last: null };
  }
}

function saveHist(entryScore) {
  const h = loadHist();
  const attempts = (h.attempts || 0) + 1;
  const avg = h.avg == null ? entryScore : (h.avg * (attempts - 1) + entryScore) / attempts;
  const next = { attempts, avg, last: entryScore };
  localStorage.setItem(HIST_KEY, JSON.stringify(next));
  renderHist();
}

function resetHist() {
  localStorage.removeItem(HIST_KEY);
  renderHist();
}

function renderHist() {
  const h = loadHist();
  $("histAttempts").textContent = String(h.attempts || 0);
  $("histAvg").textContent = h.avg == null ? "—" : `${h.avg.toFixed(2)}`;
  $("histLast").textContent = h.last == null ? "—" : `${h.last.toFixed(2)}`;
}

/* ----------------------------
   Dropdown: tests/temas (desde preguntas.json)
---------------------------- */

function buildTestLabelsFromQuestions() {
  state.testLabel.clear();

  for (const q of state.all) {
    const t = toIntOrNull(q.test);
    if (t == null) continue;

    // Si ya tenemos label para ese test, no lo machacamos
    if (state.testLabel.has(t)) continue;

    const tema = (q.tema || "").trim();
    const label = tema
      ? `Test ${t} · ${tema.replace(/^Test\s*\d+\s*[·\-:]\s*/i, "").trim()}`
      : `Test ${t}`;

    state.testLabel.set(t, label);
  }
}

function getSelectedTestsFromUI() {
  const checked = Array.from(document.querySelectorAll('#temaList input[type="checkbox"]:checked'));
  return checked
    .map((x) => toIntOrNull(x.value))
    .filter((n) => n != null);
}

function updateTemaButtonCount() {
  const btn = $("temaDropdownBtn");
  const n = getSelectedTestsFromUI().length;
  btn.textContent = n > 0 ? `Temas (${n})` : "Temas (Todos)";
}

function applyTemaSearchFilter() {
  const q = ($("temaSearch").value || "").trim().toLowerCase();
  const rows = document.querySelectorAll("#temaList .tema-row");
  rows.forEach((row) => {
    const txt = (row.getAttribute("data-text") || "").toLowerCase();
    row.style.display = txt.includes(q) ? "" : "none";
  });
}

function openTemaDropdown() {
  $("temaDropdownPanel").classList.remove("hidden");
  $("temaSearch").focus();
}

function closeTemaDropdown() {
  $("temaDropdownPanel").classList.add("hidden");
}

function toggleTemaDropdown() {
  const panel = $("temaDropdownPanel");
  const isHidden = panel.classList.contains("hidden");
  if (isHidden) openTemaDropdown();
  else closeTemaDropdown();
}

function setAllTestsChecked(checked) {
  document.querySelectorAll('#temaList input[type="checkbox"]').forEach((x) => (x.checked = checked));
  updateTemaButtonCount();
}

function renderTemaDropdown() {
  const list = $("temaList");
  list.innerHTML = "";

  // Construimos mapa test->label desde preguntas.json
  buildTestLabelsFromQuestions();

  // Orden numérico por test (1..47)
  const tests = Array.from(state.testLabel.keys()).sort((a, b) => a - b);

  if (tests.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.style.padding = "8px 0";
    empty.textContent = "No hay tests/temas (preguntas.json vacío o sin campo 'test').";
    list.appendChild(empty);
    updateTemaButtonCount();
    return;
  }

  for (const t of tests) {
    const labelTxt = state.testLabel.get(t) || `Test ${t}`;

    const row = document.createElement("label");
    row.className = "tema-row";
    row.setAttribute("data-text", labelTxt);

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = String(t); // IMPORTANTÍSIMO: value numérico para ordenar/filtrar
    cb.addEventListener("change", updateTemaButtonCount);

    const span = document.createElement("span");
    span.textContent = labelTxt;

    row.appendChild(cb);
    row.appendChild(span);
    list.appendChild(row);
  }

  updateTemaButtonCount();
}

/* ----------------------------
   Config & Pool
---------------------------- */

function readConfig() {
  const num = parseInt($("numQuestions").value, 10);
  const pen = parseFloat($("penalty").value);

  state.config.numQuestions = Number.isFinite(num) ? clamp(num, 1, 5000) : 20;
  state.config.penalty = Number.isFinite(pen) ? clamp(pen, 0, 10) : 0.333;
  state.config.shuffleOptions = $("shuffleOptions").checked;

  state.config.selectedTests = getSelectedTestsFromUI(); // [] => todos
}

function buildPool() {
  let pool = state.all.slice();

  if (state.config.selectedTests.length > 0) {
    const set = new Set(state.config.selectedTests);
    pool = pool.filter((q) => {
      const t = toIntOrNull(q.test);
      return t != null && set.has(t);
    });
  }

  state.pool = pool;
}

/* ----------------------------
   Quiz
---------------------------- */

function startQuiz() {
  readConfig();
  buildPool();

  if (state.pool.length === 0) {
    alert("No hay preguntas con los filtros seleccionados.");
    return;
  }

  const n = Math.min(state.config.numQuestions, state.pool.length);
  state.quiz = shuffle(state.pool).slice(0, n);
  state.idx = 0;
  state.answers.clear();
  state.optionOrder.clear();
  state.lastWrong = [];

  for (const q of state.quiz) {
    const letters = ["A", "B", "C", "D"];
    state.optionOrder.set(q.id, state.config.shuffleOptions ? shuffle(letters) : letters);
  }

  $("quiz").classList.remove("hidden");
  $("results").classList.add("hidden");
  renderQuestion();
}

function renderQuestion() {
  const q = state.quiz[state.idx];
  const total = state.quiz.length;

  $("progress").textContent = `${state.idx + 1}/${total}`;

  const t = toIntOrNull(q.test);
  const temaLabel = t != null
    ? (state.testLabel.get(t) || `Test ${t}`)
    : (q.tema || "Sin tema");

  $("temaTag").textContent = temaLabel;

  const selected = state.answers.get(q.id) || null;
  const order = state.optionOrder.get(q.id) || ["A", "B", "C", "D"];

  const box = $("questionBox");
  box.innerHTML = "";

  const meta = document.createElement("div");
  meta.className = "q-meta";
  meta.textContent = `ID: ${q.id}${t != null ? ` · Test ${t}` : ""}${q.n != null ? ` · Nº ${q.n}` : ""}`;
  box.appendChild(meta);

  const title = document.createElement("p");
  title.className = "q-title";
  title.textContent = q.pregunta;
  box.appendChild(title);

  const opts = document.createElement("div");
  opts.className = "options";

  for (const L of order) {
    const div = document.createElement("div");
    div.className = "opt" + (selected === L ? " selected" : "");
    div.dataset.letter = L;
    div.innerHTML = `<strong>${L})</strong> ${escapeHtml(q.opciones?.[L] ?? "")}`;
    div.addEventListener("click", () => {
      state.answers.set(q.id, L);
      renderQuestion();
    });
    opts.appendChild(div);
  }

  box.appendChild(opts);

  $("prevBtn").disabled = state.idx === 0;
  $("nextBtn").disabled = state.idx === total - 1;
}

function nextQ() {
  if (state.idx < state.quiz.length - 1) {
    state.idx++;
    renderQuestion();
  }
}

function prevQ() {
  if (state.idx > 0) {
    state.idx--;
    renderQuestion();
  }
}

function finishQuiz() {
  const total = state.quiz.length;
  let correct = 0;
  let wrong = 0;
  let blank = 0;

  const wrongItems = [];

  for (const q of state.quiz) {
    const ans = state.answers.get(q.id);
    if (!ans) {
      blank++;
      continue;
    }
    if (ans === q.correcta) {
      correct++;
    } else {
      wrong++;
      wrongItems.push({ q, selected: ans });
    }
  }

  const scoreRaw = correct - wrong * state.config.penalty;
  const score = Math.max(0, scoreRaw);
  const pct = (correct / total) * 100;

  state.lastWrong = wrongItems;

  $("quiz").classList.add("hidden");
  $("results").classList.remove("hidden");

  $("summary").innerHTML = `
    <p><strong>Total:</strong> ${total}</p>
    <p><strong>Aciertos:</strong> ${correct} · <strong>Fallos:</strong> ${wrong} · <strong>En blanco:</strong> ${blank}</p>
    <p><strong>Penalización:</strong> ${state.config.penalty}</p>
    <p><strong>Puntuación:</strong> ${score.toFixed(2)} (raw: ${scoreRaw.toFixed(2)})</p>
    <p><strong>% Acierto:</strong> ${pct.toFixed(1)}%</p>
  `;

  renderWrongList(wrongItems);
  saveHist(score);
}

function renderWrongList(items) {
  const wrap = $("wrongList");
  wrap.innerHTML = "";

  if (!items.length) {
    wrap.innerHTML = `<div class="muted">No has fallado ninguna. 🚀</div>`;
    return;
  }

  for (const it of items) {
    const { q, selected } = it;
    const t = toIntOrNull(q.test);
    const temaLabel = t != null ? (state.testLabel.get(t) || `Test ${t}`) : (q.tema || "Sin tema");

    const div = document.createElement("div");
    div.className = "wrong-item";
    div.innerHTML = `
      <div class="muted">ID: ${escapeHtml(q.id)} · ${escapeHtml(temaLabel)}</div>
      <div style="margin-top:6px;"><strong>Pregunta:</strong> ${escapeHtml(q.pregunta)}</div>
      <div style="margin-top:6px;"><strong>Tu respuesta:</strong> ${escapeHtml(selected)} · <strong>Correcta:</strong> ${escapeHtml(q.correcta)}</div>
      <div style="margin-top:6px;"><strong>Explicación:</strong> ${escapeHtml(q.explicacion || "(sin explicación)")}</div>
    `;
    wrap.appendChild(div);
  }
}

function reviewWrong() {
  if (!state.lastWrong.length) return;

  state.quiz = state.lastWrong.map((x) => x.q);
  state.idx = 0;
  state.answers.clear();
  state.optionOrder.clear();

  for (const q of state.quiz) {
    const letters = ["A", "B", "C", "D"];
    state.optionOrder.set(q.id, state.config.shuffleOptions ? shuffle(letters) : letters);
  }

  $("results").classList.add("hidden");
  $("quiz").classList.remove("hidden");
  renderQuestion();
}

/* ----------------------------
   Init
---------------------------- */

function wireDropdownEvents() {
  $("temaDropdownBtn").addEventListener("click", (e) => {
    e.preventDefault();
    toggleTemaDropdown();
  });

  $("temaSearch").addEventListener("input", applyTemaSearchFilter);

  $("temaAllBtn").addEventListener("click", () => setAllTestsChecked(true));
  $("temaNoneBtn").addEventListener("click", () => setAllTestsChecked(false));

  // Cerrar al click fuera
  document.addEventListener("click", (e) => {
    const btn = $("temaDropdownBtn");
    const panel = $("temaDropdownPanel");
    const clickedInside = panel.contains(e.target) || btn.contains(e.target);
    if (!clickedInside) closeTemaDropdown();
  });

  // Cerrar con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeTemaDropdown();
  });
}

async function init() {
  renderHist();

  try {
    const data = await cargarPreguntas(); // <-- ahora esto ya es el array
    state.all = Array.isArray(data) ? data : [];
  } catch (e) {
    alert("No se pudieron cargar las preguntas (preguntas.js / preguntas.json). Revisa que estén en la carpeta y que el servidor esté iniciado.");
    console.error(e);
    state.all = [];
  }

  renderTemaDropdown();
  wireDropdownEvents();

  $("startBtn").addEventListener("click", startQuiz);
  $("prevBtn").addEventListener("click", prevQ);
  $("nextBtn").addEventListener("click", nextQ);
  $("finishBtn").addEventListener("click", finishQuiz);

  $("reviewWrongBtn").addEventListener("click", reviewWrong);
  $("backBtn").addEventListener("click", () => {
    $("results").classList.add("hidden");
    $("quiz").classList.add("hidden");
  });

  $("resetStatsBtn").addEventListener("click", resetHist);

  updateTemaButtonCount();
}

async function cargarPreguntas() {
  // ✅ Modo Android / offline
  if (window.PREGUNTAS && Array.isArray(window.PREGUNTAS) && window.PREGUNTAS.length > 0) {
    return window.PREGUNTAS;
  }

  // ✅ Modo server
  const res = await fetch("./preguntas.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json(); // <-- devuelve array
}

init();
