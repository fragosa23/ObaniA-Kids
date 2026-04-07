/**
 * mock-api.js — ObaniA Kids
 * ─────────────────────────────────────────────────────────────
 * Camada de mock do backend.
 * Quando o backend real estiver pronto, substitui apenas este
 * ficheiro (ou liga a um endpoint externo aqui).
 *
 * Ponto de integração futura:
 *   - Python Flask/FastAPI no teu PC
 *   - ComfyUI via REST API
 *   - Modelos locais (RTX 5060 Ti)
 * ─────────────────────────────────────────────────────────────
 */

const ObaniAAPI = {

  /** URL do backend — muda para o teu servidor quando estiver pronto */
  BACKEND_URL: null, // ex: 'http://192.168.1.100:7860'

  /** Modo de operação */
  mode: 'mock', // 'mock' | 'comfyui' | 'remote'

  /**
   * Sugestões de personagens aleatórias
   * No futuro: pode ser gerado pela IA com base no contexto
   */
  suggestions: [
    { emoji: '🐺', title: 'O Lobo do Frio', desc: 'Um lobo ártico que protege a floresta gelada' },
    { emoji: '🧜', title: 'A Sereia Cientista', desc: 'Vive no oceano mas adora inventar gadgets' },
    { emoji: '🦔', title: 'O Ouriço Ninja', desc: 'Pequeno mas muito rápido e corajoso' },
    { emoji: '🐲', title: 'O Dragão Bebé', desc: 'Tem medo do fogo que sopra pela boca' },
    { emoji: '🦋', title: 'A Fada Mecânica', desc: 'Metade fada, metade robô — adora flores e engrenagens' },
    { emoji: '🦁', title: 'O Leão Curandeiro', desc: 'O mais corajoso da selva, mas com coração gentil' },
    { emoji: '🐙', title: 'O Polvo Detetive', desc: 'Oito braços, oito pistas ao mesmo tempo' },
    { emoji: '🌊', title: 'O Menino Tempestade', desc: 'Pode controlar a chuva mas detesta molhar-se' },
  ],

  /**
   * getSuggestions() — retorna N sugestões aleatórias
   */
  getSuggestions(count = 4) {
    const shuffled = [...this.suggestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  /**
   * buildPrompt(characterData) — constrói a prompt para geração
   * Esta é a função principal que a criança NUNCA vê.
   * Recebe os dados simplificados e monta uma prompt técnica.
   *
   * @param {Object} data - dados recolhidos durante o fluxo
   * @returns {string} - prompt técnica para ComfyUI/Stable Diffusion
   */
  buildPrompt(data) {
    const styleMap = {
      anime:    'anime style, cel shaded, vibrant colors, detailed lineart',
      cartoon:  'cartoon style, bold outlines, comic book, colorful, expressive',
      fantasia: 'fantasy illustration, painterly, magical atmosphere, detailed',
      '3d':     '3D render, Pixar style, subsurface scattering, soft lighting, cute',
    };

    const typeMap = {
      humano:   'human character, person',
      animal:   'anthropomorphic animal character, standing upright',
      magico:   'magical creature, fantasy being',
      robo:     'robot character, mechanical, friendly design',
    };

    const moodMap = {
      corajoso:    'brave expression, heroic pose, determined look',
      'engraçado': 'funny expression, playful pose, big smile',
      misterioso:  'mysterious expression, dark atmosphere, glowing eyes',
      'simpático': 'kind face, warm smile, soft colors',
      inteligente: 'thoughtful expression, glasses or gadgets, curious look',
      selvagem:    'wild expression, dynamic pose, nature elements',
    };

    const extra = data.extra ? `, wearing ${data.extra}` : '';
    const userIdea = data.ideia ? `, inspired by: ${data.ideia}` : '';

    const style     = styleMap[data.estilo]         || 'detailed illustration';
    const type      = typeMap[data.tipo]             || 'character';
    const mood      = moodMap[data.personalidade]    || '';
    const negative  = 'nsfw, violent, scary, realistic photo, ugly, deformed, bad anatomy, watermark, text';

    const prompt = `${type}${extra}${userIdea}, ${mood}, full body portrait, white background, ${style}, high quality, masterpiece, children book illustration`;

    return {
      positive: prompt,
      negative: negative,
      width: 512,
      height: 512,
      steps: 20,
      cfg_scale: 7,
      sampler: 'DPM++ 2M Karras',
      // workflow_id — ligado a um workflow fixo no ComfyUI
      workflow_id: `kids_character_${data.estilo || 'anime'}`,
    };
  },

  /**
   * generateImage(promptData) — envia para o backend ou faz mock
   *
   * FUTURO: quando BACKEND_URL estiver definido, envia pedido HTTP real.
   * Por agora simula um delay e devolve uma imagem placeholder.
   */
  async generateImage(characterData, onProgress) {
    const promptData = this.buildPrompt(characterData);

    if (this.BACKEND_URL && this.mode !== 'mock') {
      // ── INTEGRAÇÃO REAL (ComfyUI / Python) ──────────────────
      try {
        onProgress?.('A enviar para o computador...', 10);

        const response = await fetch(`${this.BACKEND_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptData.positive,
            negative_prompt: promptData.negative,
            width: promptData.width,
            height: promptData.height,
            steps: promptData.steps,
            cfg_scale: promptData.cfg_scale,
            workflow_id: promptData.workflow_id,
          }),
        });

        if (!response.ok) throw new Error('Backend error');

        const result = await response.json();
        onProgress?.('Pronto!', 100);

        return {
          success: true,
          imageUrl: result.image_url || result.url,
          promptUsed: promptData,
        };
      } catch (err) {
        console.warn('[ObaniAAPI] Backend indisponível, a usar mock:', err);
        // fallback para mock se o backend falhar
      }
    }

    // ── MODO MOCK ────────────────────────────────────────────
    await this._simulateProgress(onProgress);

    // Usa emoji como placeholder visual (substituir por imagem real)
    const emojiMap = {
      humano: '👦', animal: '🦊', magico: '🧚', robo: '🤖',
    };
    const placeholderEmoji = emojiMap[characterData.tipo] || '🌟';

    return {
      success: true,
      imageUrl: null, // null = mostra placeholder
      placeholderEmoji,
      promptUsed: promptData,
      isMock: true,
    };
  },

  /** Simula o progresso da geração (mock) */
  async _simulateProgress(onProgress) {
    const steps = [
      { msg: 'A misturar as cores...', pct: 20,  delay: 800  },
      { msg: 'A desenhar os contornos...', pct: 45, delay: 700 },
      { msg: 'A adicionar detalhes...', pct: 70,  delay: 900  },
      { msg: 'A polir a magia...', pct: 90,  delay: 600  },
      { msg: 'Pronto! ✨', pct: 100, delay: 400  },
    ];
    for (const step of steps) {
      await this._sleep(step.delay);
      onProgress?.(step.msg, step.pct);
    }
  },

  _sleep: (ms) => new Promise(r => setTimeout(r, ms)),

  /**
   * Dicas pedagógicas finais (aleatórias)
   */
  tips: [
    'Partilha a tua personagem com um amigo e inventem uma história juntos!',
    'Tenta criar um fundo para a tua personagem — onde é que ela vive?',
    'Que aventura pode ter esta personagem? Escreve três linhas!',
    'O que faz a tua personagem de especial? Toda a boa personagem tem um superpoder!',
    'Experimenta mudar o estilo e vê como fica diferente!',
  ],
  getRandomTip() {
    return this.tips[Math.floor(Math.random() * this.tips.length)];
  },
};

// Expõe globalmente
window.ObaniAAPI = ObaniAAPI;
