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