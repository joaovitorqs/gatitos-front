(function guardRoute() {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.replace('../index.html');
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      localStorage.removeItem('token');
      window.location.replace('../index.html');
    }
  } catch {
    localStorage.removeItem('token');
    window.location.replace('../index.html');
  }
})();

/* ── Estado do jogo ── */

const SAVE_KEY = 'rescueGatitosSave';

const defaultState = {
  cats: 0,
  money: 0,
  clickLevel: 1,
  autoLevel: 0,
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

const API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:9090'
  : 'https://rescue-gatitos.duckdns.org';
let syncTimeout = null;

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(syncStateToServer, 900);
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
  void els.catBox.offsetWidth;
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

/* ── Autoclick ── */

function autoTick() {
  if (state.autoLevel > 0) {
    state.cats += state.autoLevel;
    saveState();
    render();
  }
}

/* ── Configurações ── */

function resetPassword() {
  alert('Em breve: fluxo de redefinição de senha.');
}

function logout() {
  localStorage.removeItem('token');
  window.location.replace('../index.html');
}

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
