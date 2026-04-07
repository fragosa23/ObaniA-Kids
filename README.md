# ObaniA Kids — Documentação Técnica v1.0

## Estrutura de Ficheiros

```
obaniaKids/
├── index.html      ← App principal (9 ecrãs, estrutura HTML)
├── style.css       ← Design system completo (variáveis, animações, componentes)
├── app.js          ← Motor da app (navegação, estado, lógica guiada)
└── mock-api.js     ← Camada de API (mock agora, real depois)
```

---

## Arquitetura em 2 camadas

### Camada 1 — Frontend (este código)
- HTML + CSS + JS puro
- Corre em qualquer browser, incluindo telemóvel
- Não depende de nenhum framework
- Design system próprio com variáveis CSS
- Estado simples em memória (objeto `State`)

### Camada 2 — Backend (futuro)
- Definido em `mock-api.js`
- Quando `ObaniAAPI.BACKEND_URL` estiver preenchido, a app liga automaticamente
- Endpoint esperado: `POST /api/generate` com prompt + parâmetros
- Compatible com Python Flask/FastAPI + ComfyUI

---

## Fluxo de ecrãs

```
Welcome
  └─► Choose (O que criar?)
        └─► screen-char-1 (Tem ideia?)
              ├─► screen-char-2b (Sugestões da Lumi) ──┐
              └─► screen-char-2  (Tipo de personagem) ◄─┘
                    └─► screen-char-3 (Personalidade)
                          └─► screen-char-4 (Estilo)
                                └─► screen-char-5 (Extra + Resumo)
                                      └─► screen-generating
                                            └─► screen-result
```

---

## Como ligar ao ComfyUI (futuro)

1. No teu PC, corre um servidor Python simples que recebe pedidos e envia para o ComfyUI:

```python
# backend.py (exemplo)
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)
COMFYUI_URL = "http://127.0.0.1:8188"

@app.route('/api/generate', methods=['POST'])
def generate():
    data = request.json
    # Constrói workflow do ComfyUI aqui
    # Envia para COMFYUI_URL/prompt
    # Aguarda resultado
    # Devolve URL da imagem
    return jsonify({"image_url": "..."})

app.run(host='0.0.0.0', port=5000)
```

2. No `mock-api.js`, altera:
```javascript
BACKEND_URL: 'http://IP_DO_TEU_PC:5000',
mode: 'comfyui',
```

3. A app começa a enviar pedidos reais automaticamente.

---

## Estado da aplicação

```javascript
State = {
  character: {
    ideia,          // texto livre da criança
    tipo,           // humano | animal | magico | robo
    personalidade,  // corajoso | engraçado | misterioso | ...
    estilo,         // anime | cartoon | fantasia | 3d
    extra,          // capa | asas | espada | ...
  },
  history: [],      // pilha para o botão "Voltar"
  current: 'screen-welcome',
}
```

---

## Estilos disponíveis (v1)

| ID       | Nome     | Visual                          |
|----------|----------|---------------------------------|
| anime    | Anime    | Olhos grandes, cel shading      |
| cartoon  | Cartoon  | Banda desenhada, bold outlines  |
| fantasia | Fantasia | Painterly, atmosfera mágica     |
| 3d       | 3D       | Pixar style, render suave       |

---

## Como adicionar novos fluxos

Para adicionar "Criar Fundo" (quando chegar a vez):
1. Em `index.html`, duplica a estrutura dos ecrãs de personagem e adapta
2. Em `mock-api.js`, adiciona `buildBackgroundPrompt()` equivalente
3. Em `app.js`, adiciona os event listeners necessários
4. Em `style.css`, não precisas de tocar (design system reutilizável)

---

## Personalização da Lumi

O SVG da Lumi está inline em vários sítios. Para mudar a mascote:
- Edita os blocos `<svg>` com classe `lumi-mini` e `welcome-lumi-svg`
- Mantém a estrutura de `viewBox="0 0 120 120"`

---

## Próximos passos sugeridos

- [ ] Ligar ao backend Python + ComfyUI
- [ ] Adicionar voz (Web Speech API para entrada, TTS para a Lumi)
- [ ] Implementar "Criar Fundo"
- [ ] Implementar "Transformar Desenho" (canvas de upload)
- [ ] Sistema de galeria (localStorage ou backend)
- [ ] Modo professor (limitar gerações, ver resultados da turma)
- [ ] Animações de personagem (Lottie ou CSS simples)
