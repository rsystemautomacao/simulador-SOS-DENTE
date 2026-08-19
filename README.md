# Simulador SOS Dente

Página única (`index.html`) + uma função serverless (`api/draw.js`) para conduzir o
teste de usabilidade:

1. O participante clica em **Sortear cenário**. O front-end chama `POST /api/draw`, que
   escolhe um dos 4 cenários do PDF com sorteio ponderado: cada cenário tem peso
   `1 / (vezes_já_sorteado + 1)`, então quanto menos um cenário apareceu até agora, maior a
   chance dele sair — mas a escolha continua sendo por sorte (`Math.random`), nunca
   determinística. A contagem fica em um banco Redis compartilhado (Upstash, via Vercel),
   então funciona mesmo com cada participante acessando de um aparelho/local diferente.
   Se o banco não estiver configurado ou ficar fora do ar, a função cai automaticamente
   para um sorteio 25/25/25/25 puro — o app nunca trava por causa disso.
2. Ele abre o app (`https://sosdente.vercel.app/`) em uma nova aba e simula o atendimento
   conforme o cenário sorteado.
3. Ao voltar para a aba do sorteio (evento `visibilitychange`), a página avança
   automaticamente para o passo 3 e oferece o link do formulário de usabilidade
   (`https://forms.gle/1YrgzjnjU35EVf4S8`). Há também um botão manual ("Já terminei a
   simulação no app →") caso o navegador do participante não dispare o evento.
4. Um botão "Iniciar novo teste" reseta a sessão local para o próximo participante — a
   contagem de sorteios continua no Redis, compartilhada entre todos.

## Deploy gratuito (Vercel)

Como agora existe uma função serverless (`api/draw.js`), **precisa ser Vercel** — GitHub
Pages não roda funções. O deploy em si continua gratuito no plano Hobby.

1. Suba o repositório para o GitHub (já feito) e importe-o em https://vercel.com/new — não
   é necessário configurar build command, output directory nem variáveis de ambiente nesse
   momento (pode ignorar/apagar a seção "Environment Variables" na tela de import).
2. Depois do primeiro deploy, crie o banco compartilhado:
   - No projeto, aba **Storage** → **Create Database** → escolha **Redis** (integração
     Upstash, tem camada gratuita).
   - Na tela de conexão, marque o próprio projeto (`simulador-sos-dente`) para vincular —
     isso injeta as variáveis de ambiente automaticamente (`KV_REST_API_URL` /
     `KV_REST_API_TOKEN` ou `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`,
     dependendo da versão da integração — `api/draw.js` reconhece ambos os formatos).
3. Vá em **Deployments** e clique em **Redeploy** no último deploy (as env vars novas só
   valem a partir do próximo build).

Sem o passo 2–3, o site funciona normalmente, só que o sorteio vira aleatório puro
(sem memória entre participantes) em vez de ponderado/balanceado.

### Testar localmente

```bash
npm install
npx vercel dev
```

Sem o Redis configurado localmente, `/api/draw` cai no modo aleatório puro automaticamente
(não precisa de `.env` para rodar em desenvolvimento).
