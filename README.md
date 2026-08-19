# Simulador SOS Dente

Página única (`index.html`, sem build) para conduzir o teste de usabilidade:

1. O participante clica em **Sortear cenário** e recebe um dos 4 cenários do PDF, escolhido
   de forma balanceada (algoritmo de "baralho embaralhado" salvo no `localStorage` do
   navegador: cada bloco de 4 sorteios contém exatamente 1 de cada cenário, sem repetir o
   mesmo cenário duas vezes seguidas entre blocos).
2. Ele abre o app (`https://sosdente.vercel.app/`) em uma nova aba e simula o atendimento
   conforme o cenário sorteado.
3. Ao voltar para a aba do sorteio (evento `visibilitychange`), a página avança
   automaticamente para o passo 3 e oferece o link do formulário de usabilidade
   (`https://forms.gle/1YrgzjnjU35EVf4S8`). Há também um botão manual ("Já terminei a
   simulação no app →") caso o navegador do participante não dispare o evento.
4. Um botão "Iniciar novo teste" reseta a sessão para o próximo participante, mantendo o
   histórico do sorteio balanceado (guardado no `localStorage`, não na sessão).

**Importante:** a distribuição balanceada dos cenários só funciona corretamente se todos os
testes forem feitos no mesmo navegador/computador (ex.: um tablet/notebook usado pelo
pesquisador com cada participante). Se cada pessoa usar seu próprio celular, o
`localStorage` não é compartilhado entre eles e cada sessão começa um baralho novo.

## Deploy gratuito

### Opção A — GitHub Pages

```bash
git init
git add index.html README.md
git commit -m "Simulador SOS Dente"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/simulador-sosdente.git
git push -u origin main
```

Depois, no GitHub: **Settings → Pages → Deploy from a branch → main / (root)**.
O site fica em `https://SEU_USUARIO.github.io/simulador-sosdente/`.

### Opção B — Vercel

```bash
npm i -g vercel
vercel
```

Siga o assistente (ele detecta um site estático automaticamente). Ou, sem CLI: suba o
repositório para o GitHub e importe-o em https://vercel.com/new — não é necessário
configurar build command nem output directory.
