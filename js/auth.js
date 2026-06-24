import { api } from './api.js';

async function handleLogin() {
  try {
    const data = await api.login(email, password);
    localStorage.setItem('token', data.token);
    window.location.href = '/pages/game.html';
  } catch (e) {
    showFeedback('error', e.message);
  }
}