# Rescue Gatitos— Frontend

Interface web do projeto [Rescue Gatitos](https://rescue-gatitos.vercel.app) : tela de autenticação (login/registro) e um mini-jogo estilo *clicker* que consome a [API back-end](https://github.com/joaovitorqs/rescue-gatitos-to-work).

## Sobre o projeto

Este frontend nasceu para dar suporte a um projeto cujo foco real é o back-end (autenticação com JWT). Um mini-jogo foi incrementado por cima da tela de login para tornar a experiência mais atrativa em avaliações de portfólio — cada clique gera "gatitos", que podem ser doados e investir em melhorias, com o progresso sincronizado com a conta do usuário.

## Stack

HTML, CSS e JavaScript puro — sem framework, sem etapa de build. Hospedado na [Vercel](https://vercel.com) como site estático.

## Funcionalidades

- Cadastro e login com validação de formulário no cliente
- Token JWT armazenado no `localStorage`, enviado via header `Authorization` nas chamadas autenticadas
- Rota do jogo protegida: sem token válido (ausente ou expirado), redireciona automaticamente para o login
- Progresso do jogo salvo localmente em tempo real e sincronizado com o backend (debounce de ~900ms)
- Detecção automática de ambiente: aponta para a API local (`localhost:9090`) em desenvolvimento, e para a API de produção quando publicado

## Rodando localmente

Por ser HTML/CSS/JS puro, não há instalação nem build. Basta servir os arquivos estáticos — por exemplo, com a extensão *Live Server* do VS Code, ou:

```bash
python3 -m http.server 5500
```

Acesse `http://localhost:5500`. O frontend detecta automaticamente o ambiente local e aponta as chamadas para `http://localhost:9090` — certifique-se de que o [backend](https://github.com/joaovitorqs/rescue-gatitos-to-work) esteja rodando nessa porta.

## Deploy

Publicado na Vercel com deploy automático a cada push na branch `main`. Não há variáveis de ambiente ou passo de build a configurar — a Vercel serve os arquivos estáticos diretamente.

## Backend

Este frontend consome a API deste repositório: **[rescue-gatitos-to-work](https://github.com/joaovitorqs/rescue-gatitos-to-work)** — onde está a implementação de autenticação JWT que é o foco técnico do projeto.
