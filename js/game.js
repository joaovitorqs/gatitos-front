/* ── game.js ──
   Primeira coisa que roda: verifica se há token válido.
   Sem token → redireciona para o login imediatamente.
   Com token → libera a página normalmente.
*/

(function guardRoute() {
  const token = localStorage.getItem('token');

  if (!token) {
    // Sem token: volta para o login
    window.location.replace('../index.html');
    return;
  }

  // Token existe: decodifica o payload para checar expiração
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      // Token expirado: limpa e redireciona
      localStorage.removeItem('token');
      window.location.replace('../index.html');
    }
    // Token válido → página carrega normalmente
  } catch {
    // Token malformado: limpa e redireciona
    localStorage.removeItem('token');
    window.location.replace('../index.html');
  }
})();

/* ── Estado do jogo ── */

const SAVE_KEY = 'rescueGatitosSave';

const defaultState = {
  cats: 0,
  money: 0,
  clickLevel: 1,      // gatinhos por clique = clickLevel
  autoLevel: 0,        // gatinhos por segundo = autoLevel
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...defaultState };
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultState };
  }
}

const API = 'http://localhost:9090';
let syncTimeout = null;

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(syncStateToServer, 1500);
}

async function syncStateToServer() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    await fetch(`${API}/game/state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        qtdGatitos: state.cats,
        dinheiro: state.money,
        levelClick: state.clickLevel,
        levelAutoClick: state.autoLevel
      })
    });
  } catch (e) {
    console.warn('Falha ao sincronizar progresso:', e);
  }
}

/* ── Preços (escalam com o nível) ── */

const SELL_ONE_BASE = 10;
const CLICK_UPGRADE_BASE = 50;
const AUTO_UPGRADE_BASE = 100;

function sellOnePrice() {
  return SELL_ONE_BASE;
}

function clickUpgradePrice() {
  return Math.round(CLICK_UPGRADE_BASE * Math.pow(1.6, state.clickLevel - 1));
}

function autoUpgradePrice() {
  return Math.round(AUTO_UPGRADE_BASE * Math.pow(1.7, state.autoLevel));
}

/* ── Referências DOM ── */

let els = {};

function cacheEls() {
  els = {
    catBox: document.getElementById('catBox'),
    clickArea: document.getElementById('clickArea'),
    statCats: document.getElementById('statCats'),
    statMoney: document.getElementById('statMoney'),
    statClickLevel: document.getElementById('statClickLevel'),
    statAutoLevel: document.getElementById('statAutoLevel'),
    sellOneBtn: document.getElementById('sellOneBtn'),
    sellOnePrice: document.getElementById('sellOnePrice'),
    sellAllBtn: document.getElementById('sellAllBtn'),
    buyClickBtn: document.getElementById('buyClickBtn'),
    clickUpgradePrice: document.getElementById('clickUpgradePrice'),
    clickUpgradeDesc: document.getElementById('clickUpgradeDesc'),
    buyAutoBtn: document.getElementById('buyAutoBtn'),
    autoUpgradePrice: document.getElementById('autoUpgradePrice'),
    autoUpgradeDesc: document.getElementById('autoUpgradeDesc'),
    resetPasswordBtn: document.getElementById('resetPasswordBtn'),
    logoutBtn: document.getElementById('logoutBtn')
  };
}

function formatMoney(v) {
  return 'R$ ' + v.toLocaleString('pt-BR');
}

function render() {
  els.statCats.textContent = state.cats.toLocaleString('pt-BR');
  els.statMoney.textContent = formatMoney(state.money);
  els.statClickLevel.textContent = 'Nível ' + state.clickLevel;
  els.statAutoLevel.textContent = 'Nível ' + state.autoLevel;

  els.sellOnePrice.textContent = sellOnePrice();
  els.clickUpgradePrice.textContent = clickUpgradePrice();
  els.autoUpgradePrice.textContent = autoUpgradePrice();

  els.clickUpgradeDesc.textContent = `Gere ${state.clickLevel + 1} gatito por clique`;
  els.autoUpgradeDesc.textContent = state.autoLevel > 0
    ? `Gere ${state.autoLevel+1} gatito(s)/seg automaticamente`
    : 'Gere gatitos automaticamente';

  els.sellOneBtn.disabled = state.cats < 1;
  els.sellAllBtn.disabled = state.cats < 1;
  els.buyClickBtn.disabled = state.money < clickUpgradePrice();
  els.buyAutoBtn.disabled = state.money < autoUpgradePrice();

}

/* ── Ações ── */

function showFloatText(text, x, y) {
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  els.clickArea.style.position = 'relative';
  els.clickArea.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function handleClick(e) {
  state.cats += state.clickLevel;
  saveState();
  render();

  els.catBox.classList.remove('bounce');
  void els.catBox.offsetWidth; // reinicia a animação
  els.catBox.classList.add('bounce');

  const rect = els.clickArea.getBoundingClientRect();
  const x = (e.clientX ?? rect.width / 2) - rect.left;
  const y = (e.clientY ?? rect.height / 2) - rect.top;
  showFloatText('+' + state.clickLevel, x, y);
}

function sellOne() {
  if (state.cats < 1) return;
  state.cats -= 1;
  state.money += sellOnePrice();
  saveState();
  render();
}

function sellAll() {
  if (state.cats < 1) return;
  state.money += state.cats * sellOnePrice();
  state.cats = 0;
  saveState();
  render();
}

function buyClickUpgrade() {
  const price = clickUpgradePrice();
  if (state.money < price) return;
  state.money -= price;
  state.clickLevel += 1;
  saveState();
  render();
}

function buyAutoUpgrade() {
  const price = autoUpgradePrice();
  if (state.money < price) return;
  state.money -= price;
  state.autoLevel += 1;
  saveState();
  render();
}

/* ── Autoclick (tick a cada segundo) ── */

function autoTick() {
  if (state.autoLevel > 0) {
    state.cats += state.autoLevel;
    saveState();
    render();
  }
}

/* ── Configurações ── */

function resetPassword() {
  // Placeholder: fluxo real de redefinição ainda será implementado
  alert('Em breve: fluxo de redefinição de senha.');
}

function logout() {
  localStorage.removeItem('token');
  window.location.replace('../index.html');
}

/* ── Inicialização ── */

function init() {
  cacheEls();
  render();

  els.catBox.addEventListener('click', handleClick);
  els.sellOneBtn.addEventListener('click', sellOne);
  els.sellAllBtn.addEventListener('click', sellAll);
  els.buyClickBtn.addEventListener('click', buyClickUpgrade);
  els.buyAutoBtn.addEventListener('click', buyAutoUpgrade);
  els.resetPasswordBtn.addEventListener('click', resetPassword);
  els.logoutBtn.addEventListener('click', logout);

  setInterval(autoTick, 1000);
}

document.addEventListener('DOMContentLoaded', init);

/**
 * Recorta um spritesheet (128x64, 5 frames de 32x32) em 5 data URLs,
 * uma para cada estado, e injeta como variáveis CSS no :root.
 *
 * Layout do sheet:
 *  col0 = pressed3 | col1 = pressed2 | col2 = pressed1 | col3 = normal   (linha de cima)
 *  bottom-left     = hover                                              (linha de baixo)
 */
function sliceButtonSheet(sheetSrc, cssPrefix) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const FRAME = 32;
      const SCALE = 4;
      const frames = {
        p3:       { x: 0,        y: 0 },
        p2:       { x: FRAME,    y: 0 },
        p1:       { x: FRAME*2,  y: 0 },
        normal:   { x: FRAME*3,  y: 0 },
        hover:    { x: 0,        y: FRAME },
        disabled: { x: FRAME,    y: FRAME },
      };

      const canvas = document.createElement('canvas');
      canvas.width = FRAME * SCALE;
      canvas.height = FRAME * SCALE;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const root = document.documentElement.style;

      for (const [state, pos] of Object.entries(frames)) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          pos.x, pos.y, FRAME, FRAME,
          0, 0, FRAME * SCALE, FRAME * SCALE
        );
        const dataUrl = canvas.toDataURL('image/png');
        root.setProperty(`--${cssPrefix}-${state}`, `url(${dataUrl})`);
      }
      resolve();
    };
    img.onerror = reject;
    img.src = sheetSrc;
  });
}

// Inicializa as 3 cores ao carregar a página
Promise.all([
  sliceButtonSheet('/assets/images/spritesheet_botton_green.png', 'green'),
  sliceButtonSheet('/assets/images/spritesheet_botton_brown.png', 'brown'),
  sliceButtonSheet('/assets/images/spritesheet_botton_red.png', 'red'),
]).then(() => {
  console.log('Sprites de botão prontos.');
});

function animateClick(button) {
  const stages = ['stage-1', 'stage-2', 'stage-3'];
  let i = 0;
  const interval = setInterval(() => {
    button.classList.remove(...stages);
    button.classList.add(stages[i]);
    i++;
    if (i >= stages.length) {
      clearInterval(interval);
      setTimeout(() => button.classList.remove(...stages), 50);
    }
  }, 40);
}

document.querySelectorAll('.pixel-btn').forEach(btn => {
  btn.addEventListener('mousedown', () => animateClick(btn));
});
