const API = 'http://localhost:9090';

/* ── Tab switching ── */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
}

/* ── Password toggle ── */
function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  const isText = inp.type === 'text';

  inp.type = isText ? 'password' : 'text';

  btn.innerHTML = isText
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
         <circle cx="12" cy="12" r="3"/>
       </svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
         <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
         <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
         <line x1="1" y1="1" x2="23" y2="23"/>
       </svg>`;
}

/* ── Validation helpers ── */
function clearErrors(...ids) {
  ids.forEach(id => {
    document.getElementById(id)?.classList.remove('error-input', 'visible');
  });
}

function showError(inputId, errId) {
  document.getElementById(inputId)?.classList.add('error-input');
  document.getElementById(errId)?.classList.add('visible');
}

function showFeedback(id, type, msg) {
  const el = document.getElementById(id);
  el.className = `feedback show ${type}`;
  el.textContent = msg;
}

function hideFeedback(id) {
  document.getElementById(id).className = 'feedback';
}

/* ── Login ── */
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  let valid = true;

  clearErrors(
    'login-email',
    'login-email-err',
    'login-password',
    'login-pass-err'
  );

  hideFeedback('login-feedback');

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    showError('login-email', 'login-email-err');
    valid = false;
  }

  if (!password) {
    showError('login-password', 'login-pass-err');
    valid = false;
  }

  if (!valid) return;

  const btn = document.getElementById('btn-login');
  btn.classList.add('loading');

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('rescueGatitosSave', JSON.stringify({
        cats: data.gameState.qtdGatitos,
        money: data.gameState.dinheiro,
        clickLevel: data.gameState.levelClick,
        autoLevel: data.gameState.levelAutoClick,
      }));

      showFeedback('login-feedback', 'success', `Bem-vindo, ${data.nickName}! Redirecionando...`);
      window.location.href = '/pages/game.html';
    } else {
      showFeedback(
        'login-feedback',
        'error',
        data.message || 'Credenciais inválidas.'
      );
    }
  } catch (e) {
    showFeedback(
      'login-feedback',
      'error',
      'Não foi possível conectar ao servidor.'
    );
  } finally {
    btn.classList.remove('loading');
  }
}

/* ── Register ── */
async function handleRegister() {
  const nickName = document.getElementById('reg-nick').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  let valid = true;

  clearErrors(
    'reg-nick',
    'reg-nick-err',
    'reg-email',
    'reg-email-err',
    'reg-password',
    'reg-pass-err'
  );

  hideFeedback('register-feedback');

  if (!nickName) {
    showError('reg-nick', 'reg-nick-err');
    valid = false;
  }

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    showError('reg-email', 'reg-email-err');
    valid = false;
  }

  if (password.length < 6) {
    showError('reg-password', 'reg-pass-err');
    valid = false;
  }

  if (!valid) return;

  const btn = document.getElementById('btn-register');
  btn.classList.add('loading');

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickName,
        email,
        password
      })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('rescueGatitosSave', JSON.stringify({
        cats: data.gameState.qtdGatitos,
        money: data.gameState.dinheiro,
        clickLevel: data.gameState.levelClick,
        autoLevel: data.gameState.levelAutoClick,
      }));

      showFeedback('login-feedback', 'success', `Bem-vindo, ${data.nickName}! Redirecionando...`);
      window.location.href = '/pages/game.html';
    } else {
      showFeedback(
        'register-feedback',
        'error',
        data.message || 'Não foi possível criar a conta.'
      );
    }
  } catch (e) {
    showFeedback(
      'register-feedback',
      'error',
      'Não foi possível conectar ao servidor.'
    );
  } finally {
    btn.classList.remove('loading');
  }
}

/* ── Enter key submit ── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;

  const loginActive =
    document.getElementById('panel-login')
      .classList.contains('active');

  if (loginActive) {
    handleLogin();
  } else {
    handleRegister();
  }
});