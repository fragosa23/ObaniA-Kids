/**
 * app.js — ObaniA Kids
 * ─────────────────────────────────────────────────────────────
 * Motor principal da app: navegação, estado, lógica guiada.
 * Separado do mock-api.js para facilitar evolução futura.
 * ─────────────────────────────────────────────────────────────
 */

// ──────────────────────────────────────────────────────────────
// ESTADO GLOBAL da sessão de criação
// ──────────────────────────────────────────────────────────────
const State = {
  /** dados recolhidos durante o fluxo */
  character: {
    ideia:        null,
    tipo:         null,
    personalidade: null,
    estilo:       null,
    extra:        null,
  },
  /** pilha de navegação para o botão "voltar" */
  history: [],
  /** ecrã atual */
  current: 'screen-welcome',
};

// ──────────────────────────────────────────────────────────────
// NAVEGAÇÃO
// ──────────────────────────────────────────────────────────────

function goTo(screenId) {
  const current = document.getElementById(State.current);
  const next    = document.getElementById(screenId);
  if (!next || screenId === State.current) return;

  current?.classList.add('exit-left');
  current?.classList.remove('active');

  next.classList.add('active');
  next.scrollTop = 0;

  setTimeout(() => current?.classList.remove('exit-left'), 400);

  State.history.push(State.current);
  State.current = screenId;
}

function goBack() {
  if (State.history.length === 0) return;
  const prev = State.history.pop();
  const current = document.getElementById(State.current);
  const target  = document.getElementById(prev);
  if (!target) return;

  current?.classList.remove('active');
  current?.style?.removeProperty('transform');
  target.classList.add('active');
  target.scrollTop = 0;

  State.current = prev;
}

// ──────────────────────────────────────────────────────────────
// TYPEWRITER da Lumi no ecrã de boas-vindas
// ──────────────────────────────────────────────────────────────

function typeWriter(elementId, text, speed = 38, callback) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let i = 0;
  el.textContent = '';
  const timer = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(timer);
      callback?.();
    }
  }, speed);
}

// ──────────────────────────────────────────────────────────────
// SUGESTÕES DA LUMI
// ──────────────────────────────────────────────────────────────

function renderSuggestions() {
  const grid = document.getElementById('suggestion-grid');
  if (!grid) return;
  const items = ObaniAAPI.getSuggestions(4);
  grid.innerHTML = items.map(s => `
    <div class="suggestion-card" data-title="${s.title}" data-emoji="${s.emoji}">
      <div class="sug-emoji">${s.emoji}</div>
      <div class="sug-title">${s.title}</div>
      <div class="sug-desc">${s.desc}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      State.character.ideia = card.dataset.title;
      goTo('screen-char-2');
    });
  });
}

// ──────────────────────────────────────────────────────────────
// RESUMO DO PERSONAGEM
// ──────────────────────────────────────────────────────────────

function updateSummary() {
  const box   = document.getElementById('summary-items');
  const c     = State.character;
  if (!box) return;

  const labels = {
    tipo: { humano: '👦 Humano', animal: '🦊 Animal', magico: '🧚 Mágico', robo: '🤖 Robô' },
    personalidade: {
      corajoso: '⚔️ Corajoso', 'engraçado': '😂 Engraçado',
      misterioso: '🌙 Misterioso', 'simpático': '🌸 Simpático',
      inteligente: '🔬 Inteligente', selvagem: '🌊 Selvagem',
    },
    estilo: { anime: '🎌 Anime', cartoon: '💥 Cartoon', fantasia: '✨ Fantasia', '3d': '◈ 3D' },
  };

  const tags = [];
  if (c.ideia)         tags.push(`💭 "${c.ideia.substring(0, 30)}${c.ideia.length > 30 ? '…' : ''}"`);
  if (c.tipo)          tags.push(labels.tipo[c.tipo] || c.tipo);
  if (c.personalidade) tags.push(labels.personalidade[c.personalidade] || c.personalidade);
  if (c.estilo)        tags.push(labels.estilo[c.estilo] || c.estilo);
  if (c.extra)         tags.push(`✨ ${c.extra}`);

  box.innerHTML = tags.map(t => `<span class="summary-tag">${t}</span>`).join('');
}

// ──────────────────────────────────────────────────────────────
// ECRÃ DE RESULTADO
// ──────────────────────────────────────────────────────────────

function showResult(result) {
  // Emoji no placeholder conforme o tipo
  const placeholderEl = document.getElementById('placeholder-char');
  const emojiMap = {
    humano: '👦', animal: '🦊', magico: '🧚', robo: '🤖',
  };
  if (placeholderEl) {
    placeholderEl.textContent = result.placeholderEmoji || emojiMap[State.character.tipo] || '🌟';
  }

  // Se houver imagem real (já carregada pelo generateImage)
  if (result.imageUrl) {
    const img = document.getElementById('result-image');
    const placeholder = document.getElementById('result-placeholder');
    if (img) {
      img.src = result.imageUrl;
      img.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
  }

  // Tags de resultado
  const tagsEl = document.getElementById('result-tags');
  if (tagsEl) {
    const c = State.character;
    const tagList = [c.tipo, c.personalidade, c.estilo, c.extra].filter(Boolean);
    tagsEl.innerHTML = tagList.map(t => `<span class="result-tag">${t}</span>`).join('');
  }

  // Prompt gerada (visível apenas em modo debug)
  const promptEl = document.getElementById('generated-prompt');
  if (promptEl && result.promptUsed) {
    promptEl.textContent = JSON.stringify(result.promptUsed, null, 2);
  }

  // Dica final
  const tipEl = document.getElementById('result-tip-text');
  if (tipEl) tipEl.textContent = ObaniAAPI.getRandomTip();

  goTo('screen-result');
}

// ──────────────────────────────────────────────────────────────
// GERAÇÃO (com animação de progresso)
// ──────────────────────────────────────────────────────────────

async function startGeneration() {
  goTo('screen-generating');

  // Mensagens a rodar enquanto espera (pode demorar 30-60s)
  const loopMessages = [
    '🎨 A misturar as cores mágicas...',
    '✏️ A desenhar os contornos...',
    '✨ A adicionar detalhes especiais...',
    '🌟 A polir a magia...',
    '💫 Quase pronto...',
    '🎨 A afinar os últimos toques...',
    '✨ A Lumi está a trabalhar muito...',
    '🌈 A cor está a ficar incrível...',
    '💫 Só mais um momento...',
  ];

  const steps = ['gstep-1', 'gstep-2', 'gstep-3'];
  let msgIndex = 0;
  let stepIndex = 0;
  let done = false;

  // Atualiza texto a cada 3 segundos em loop
  const txtEl = document.getElementById('generating-text');
  const msgTimer = setInterval(() => {
    if (done) return;
    if (txtEl) txtEl.textContent = loopMessages[msgIndex % loopMessages.length];
    msgIndex++;

    // Avança / reinicia os steps visuais
    steps.forEach(id => document.getElementById(id)?.classList.remove('active', 'done'));
    document.getElementById(steps[stepIndex % steps.length])?.classList.add('active');
    stepIndex++;
  }, 2500);

  // Mostra o primeiro texto imediatamente
  if (txtEl) txtEl.textContent = loopMessages[0];
  document.getElementById('gstep-1')?.classList.add('active');

  try {
    const result = await ObaniAAPI.generateImage(
      State.character,
      (msg, pct) => {
        if (pct === 100 && txtEl) txtEl.textContent = '✨ Imagem pronta!';
      }
    );

    done = true;
    clearInterval(msgTimer);

    if (txtEl) txtEl.textContent = '✨ Imagem pronta!';
    steps.forEach(id => {
      const el = document.getElementById(id);
      el?.classList.remove('active');
      el?.classList.add('done');
    });

    await new Promise(r => setTimeout(r, 700));
    showResult(result);

  } catch (err) {
    done = true;
    clearInterval(msgTimer);
    console.error('[ObaniA Kids] Erro na geração:', err);
    showResult({ success: false, placeholderEmoji: '🌟', isMock: true });
  }
}

// ──────────────────────────────────────────────────────────────
// EVENT LISTENERS — delegação centralizada
// ──────────────────────────────────────────────────────────────

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-screen]');
  const card = e.target.closest('[data-key]');
  const createCard = e.target.closest('.create-card:not(.card-coming)');

  // ── Cards de criação principal (ecrã 2) ──
  if (createCard && !el) {
    const type = createCard.dataset.type;
    if (type === 'personagem') {
      Object.assign(State.character, { ideia: null, tipo: null, personalidade: null, estilo: null, extra: null });
      goTo('screen-char-1');
    }
    return;
  }

  // ── Escolha com data-screen (navega automaticamente) ──
  if (el && !card) {
    const screen   = el.dataset.screen;
    const value    = el.dataset.value;

    // Escolha de ter ideia ou não
    if (el.id === undefined && screen === 'char-2') {
      if (value === 'propria') {
        document.getElementById('idea-input-box')?.classList.remove('hidden');
        el.classList.add('selected');
        el.closest('.choice-group')?.querySelectorAll('.choice-card').forEach(c => {
          if (c !== el) c.classList.remove('selected');
        });
        return; // não navega ainda — espera o textarea
      } else if (value === 'ajuda') {
        goTo('screen-char-2b');
        renderSuggestions();
        return;
      }
    }

    if (screen) goTo(`screen-${screen}`);
    return;
  }

  // ── Cards com data-key (guardam valor no State) ──
  if (card) {
    const key    = card.dataset.key;
    const value  = card.dataset.value;
    const screen = card.dataset.screen;

    // Selecção visual
    card.closest('.choice-group, .four-grid, .mood-grid, .style-grid')
      ?.querySelectorAll('[data-key]')
      .forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    // Guarda no estado
    if (key && value) State.character[key] = value;

    // Atualiza resumo se estiver na última step
    updateSummary();

    // Navega após pequena pausa (feedback visual)
    if (screen) setTimeout(() => goTo(`screen-${screen}`), 220);
    return;
  }
});

// ── Chips de extras ──
document.getElementById('extra-chips')?.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  chip.classList.add('selected');
  State.character.extra = chip.dataset.value || null;
  updateSummary();
});

// ── Botão iniciar ──
document.getElementById('btn-start')?.addEventListener('click', () => {
  goTo('screen-choose');
});

// ── Textarea de ideia própria ──
document.getElementById('idea-text')?.addEventListener('input', (e) => {
  const count = document.getElementById('idea-count');
  if (count) count.textContent = e.target.value.length;
});

document.getElementById('btn-idea-next')?.addEventListener('click', () => {
  const text = document.getElementById('idea-text')?.value.trim();
  State.character.ideia = text || null;
  goTo('screen-char-2');
});

// ── Botão de gerar ──
document.getElementById('btn-generate')?.addEventListener('click', () => {
  startGeneration();
});

// ── Botão novas sugestões ──
document.getElementById('btn-new-suggestions')?.addEventListener('click', () => {
  renderSuggestions();
});

// ── Resultado: tentar diferente ──
document.getElementById('btn-retry')?.addEventListener('click', () => {
  startGeneration();
});

// ── Resultado: criar outra ──
document.getElementById('btn-new')?.addEventListener('click', () => {
  Object.assign(State.character, { ideia: null, tipo: null, personalidade: null, estilo: null, extra: null });
  State.history = [];
  goTo('screen-choose');
});

// ── Resultado: guardar (placeholder) ──
document.getElementById('btn-save')?.addEventListener('click', () => {
  alert('💾 Guardar estará disponível em breve! Por agora podes fazer uma captura de ecrã. 📸');
});

// ──────────────────────────────────────────────────────────────
// INIT — arranque da app
// ──────────────────────────────────────────────────────────────

function init() {
  // Primeira screen visível
  document.getElementById('screen-welcome')?.classList.add('active');

  // Typewriter da Lumi
  setTimeout(() => {
    typeWriter(
      'bubble-welcome-text',
      'Olá! Sou a Lumi ✨ Vamos criar algo incrível juntos?',
      40,
      () => {
        // Mostra o botão depois do texto aparecer
        const btn = document.getElementById('btn-start');
        if (btn) {
          btn.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
          btn.style.opacity    = '1';
          btn.style.transform  = 'translateY(0)';
        }
      }
    );
  }, 600);
}

// ── Seta de scroll ──────────────────────────────────────────
function initScrollArrow() {
  const arrow = document.getElementById('scroll-arrow');
  if (!arrow) return;

  function updateArrow() {
    const screen = document.querySelector('.screen.active');
    if (!screen) return;
    const canScroll = screen.scrollHeight > screen.clientHeight + 10;
    const atBottom  = screen.scrollTop + screen.clientHeight >= screen.scrollHeight - 20;
    arrow.classList.toggle('hidden', !canScroll || atBottom);
  }

  arrow.addEventListener('click', () => {
    const screen = document.querySelector('.screen.active');
    if (screen) screen.scrollBy({ top: 200, behavior: 'smooth' });
  });

  document.addEventListener('scroll', updateArrow, true);
  setInterval(updateArrow, 500);
}

// Aguarda DOM e fontes
document.addEventListener('DOMContentLoaded', () => { init(); initScrollArrow(); });
