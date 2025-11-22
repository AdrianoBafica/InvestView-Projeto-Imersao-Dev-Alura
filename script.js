/* InvestView - script.js
   Busca inteligente, sugestão durante digitação, dark mode persistente,
   exibição de card com preços e métricas (dados de exemplo em data.json).
*/

/* ---------- ESTADO GLOBAL ---------- */
let dados = [];
const input = document.getElementById("inputBusca");
const resultado = document.getElementById("resultado");
const suggestionsEl = document.getElementById("suggestions");
const btnBuscar = document.getElementById("btnBuscar");
const toggleBtn = document.getElementById("toggleDarkMode");

/* ---------- CARREGAR DADOS (data.json) ---------- */
fetch("data.json")
  .then(res => res.json())
  .then(json => {
    dados = json;
    // opcional: ordenar por ticker
    dados.sort((a,b) => a.ticker.localeCompare(b.ticker));
  })
  .catch(err => {
    resultado.innerHTML = `<div class="card"><p>Erro ao carregar dados: ${err}</p></div>`;
  });

/* ---------- DARK MODE: persistência via localStorage ---------- */
function applyTheme(theme) {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(theme);
  toggleBtn.textContent = theme === "dark" ? "☀️ Modo Claro" : "🌙 Modo Escuro";
  localStorage.setItem("investview_theme", theme);
}
const savedTheme = localStorage.getItem("investview_theme") || "light";
applyTheme(savedTheme);

toggleBtn.addEventListener("click", () => {
  const newTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(newTheme);
});

/* ---------- HELPERS ---------- */
function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function safeLower(s) { return (s || "").toString().toLowerCase(); }

/* ---------- BUSCA INTELIGENTE ---------- */
function buscar() {
  const q = safeLower(input.value).trim();
  if (!q) {
    resultado.innerHTML = `<div class="card"><p>Digite algo para buscar. Você pode procurar por ticker (PETR4), nome (Petrobras) ou setor (Petróleo).</p></div>`;
    return;
  }

  // procura exata por ticker primeiro
  let found = dados.find(item => safeLower(item.ticker) === q);

  if (!found) {
    // procura por nome que contenha a query
    found = dados.find(item => safeLower(item.nome).includes(q) || safeLower(item.setor).includes(q));
  }

  if (!found) {
    // fallback: busca por partes (tokenização)
    const tokens = q.split(/\s+/);
    found = dados.find(item => tokens.every(t => safeLower(item.nome).includes(t) || safeLower(item.setor).includes(t)));
  }

  if (!found) {
    resultado.innerHTML = `<div class="card"><p>Nenhuma ação encontrada para: <strong>${input.value}</strong></p></div>`;
    return;
  }

  renderCard(found);
}

/* ---------- RENDER CARD ---------- */
function renderCard(acao) {
  // formata números
  const preco = formatBRL(acao.preco);
  const rent = Number(acao.rentabilidade_anual).toFixed(2) + "%";
  const dy = Number(acao.dividend_yield).toFixed(2) + "%";
  const riscoClass = (acao.risco || "Médio").toLowerCase();

  resultado.innerHTML = `
    <div class="card">
      <h2>${acao.ticker} — ${acao.nome}</h2>
      <p><strong>Setor:</strong> ${acao.setor}</p>
      <p><strong>Descrição:</strong> ${acao.descricao}</p>
      <p><strong>Data de nascimento:</strong> ${acao.data_nascimento}</p>

      <hr>

      <div class="stats">
        <div class="stat">
          <small>💰 Preço atual</small>
          <div>${preco}</div>
        </div>

        <div class="stat">
          <small>📈 Rentabilidade anual</small>
          <div>${rent}</div>
        </div>

        <div class="stat">
          <small>🏦 Dividend Yield</small>
          <div>${dy}</div>
        </div>

        <div class="stat">
          <small>⚠ Risco</small>
          <div><span class="risco ${riscoClass}">${acao.risco}</span></div>
        </div>
      </div>
    </div>
  `;
}

/* ---------- SUGESTÕES ENQUANTO DIGITA (top 6) ---------- */
function updateSuggestions() {
  const q = safeLower(input.value).trim();
  suggestionsEl.innerHTML = "";

  if (!q) {
    suggestionsEl.setAttribute("aria-hidden","true");
    return;
  }

  // filtrar: ticker exato, nome ou setor que contenham q
  const matches = dados.filter(item =>
    safeLower(item.ticker).includes(q) ||
    safeLower(item.nome).includes(q) ||
    safeLower(item.setor).includes(q)
  ).slice(0,6);

  if (matches.length === 0) {
    suggestionsEl.setAttribute("aria-hidden","true");
    return;
  }

  suggestionsEl.setAttribute("aria-hidden","false");
  for (const m of matches) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${m.ticker} — ${m.nome}</span><span class="muted">${m.setor}</span>`;
    li.addEventListener("click", () => {
      input.value = `${m.ticker}`;
      suggestionsEl.innerHTML = "";
      input.focus();
      buscar();
    });
    suggestionsEl.appendChild(li);
  }
}

/* ---------- EVENTOS ---------- */
input.addEventListener("input", () => {
  updateSuggestions();
});

input.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") {
    ev.preventDefault();
    suggestionsEl.innerHTML = "";
    buscar();
  }
});

btnBuscar.addEventListener("click", () => {
  suggestionsEl.innerHTML = "";
  buscar();
});

/* click fora das sugestões fecha */
document.addEventListener("click", (ev) => {
  if (!ev.target.closest(".search-box") && !ev.target.closest(".suggestions")) {
    suggestionsEl.innerHTML = "";
  }
});
