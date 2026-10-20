# Google Play — textos e respostas dos formulários

Material de apoio para preencher o Play Console. Itens entre colchetes
(`[RAZÃO SOCIAL]`, `[CNPJ]`, `[E-MAIL DE CONTATO]`) precisam ser substituídos,
inclusive nas páginas em `docs/`.

---

## Ficha principal da loja

**Nome do app** (máx. 30)
My Trip Buddy

**Descrição curta** (máx. 80)
Roteiro, checklist, looks e orçamento da sua viagem, tudo num lugar só.

**Descrição completa** (máx. 4000)

> O My Trip Buddy é o seu parceiro de viagem: organize tudo o que importa antes e durante a viagem num só app, do jeito mais leve e bonito possível.
>
> ✈️ SUAS VIAGENS EM UM LUGAR
> Cadastre destinos, datas, voos e hospedagens. Acompanhe a contagem regressiva para o embarque e receba lembretes nos dias que você escolher.
>
> 🗺️ ROTEIRO NO MAPA
> Veja seus destinos no mapa e navegue pelo roteiro dia a dia.
>
> ✅ CHECKLIST AUTOMÁTICO
> Ao criar uma viagem, o app monta um checklist com o essencial — passaporte, seguro, check-in, adaptador de tomada — e avisa quando o destino pode exigir visto.
>
> 👗 LOOKS DA MALA
> Monte os looks de cada dia com fotos da sua galeria ou inspirações do Pinterest e nunca mais esqueça uma peça.
>
> 💰 ORÇAMENTO
> Controle os gastos por categoria (hospedagem, transporte, alimentação, passeios, compras) com conversão de moedas.
>
> ☁️ SINCRONIZADO E SEGURO
> Entre com Google, Apple ou e-mail e acesse suas viagens em qualquer aparelho. Sem anúncios e sem venda de dados.
>
> Boa viagem! 🌍

**Categoria:** Viagem e local
**E-mail de contato:** [E-MAIL DE CONTATO]
**Site:** URL do GitHub Pages (ver "Publicar as páginas" abaixo)
**Política de privacidade:** `https://7haymuller.github.io/my-trip-buddy/privacy.html`

**Imagens necessárias**
- Ícone: 512×512 PNG (pode partir de `assets/images/icon.png`)
- Imagem de destaque: 1024×500 PNG/JPG
- Screenshots de celular: mínimo 2, recomendado 4 a 8 (proporção 9:16, ex. 1080×1920).
  Sugestão: home com contagem regressiva, roteiro no mapa, checklist, looks, orçamento.

---

## Acesso ao app (Painel → Acesso ao app)

O login por e-mail usa código enviado por e-mail, que o revisor não recebe.
Opções:

1. **Recomendado:** criar um Gmail só para testes (ex. `mytripbuddy.review@gmail.com`),
   já com uma viagem de exemplo cadastrada, e informar e-mail + senha com a instrução:
   *"Toque em 'Continuar com Google' e entre com a conta abaixo."*
   Desative a verificação em duas etapas dessa conta, senão o revisor fica travado.
2. Informar que qualquer conta Google funciona pelo botão "Continuar com Google".

---

## Segurança dos dados (Painel → Segurança dos dados)

| Pergunta | Resposta |
|---|---|
| O app coleta ou compartilha dados do usuário? | **Sim** |
| Todos os dados são criptografados em trânsito? | **Sim** |
| Os usuários podem pedir a exclusão dos dados? | **Sim** — URL: `https://7haymuller.github.io/my-trip-buddy/delete-account.html` |
| Possui criação de conta? | **Sim** — e-mail com código, Google e Apple |
| Link para exclusão de conta | o mesmo URL acima |

**Tipos de dados coletados** (nenhum é "compartilhado": provedores de serviço
como Supabase não contam como compartilhamento para o Google):

| Categoria → tipo | Coletado | Obrigatório? | Finalidade |
|---|---|---|---|
| Informações pessoais → Nome | Sim | Opcional (vem do Google/Apple) | Funcionalidade do app, Gerenciamento da conta |
| Informações pessoais → Endereço de e-mail | Sim | Obrigatório | Funcionalidade do app, Gerenciamento da conta |
| Informações pessoais → IDs do usuário | Sim | Obrigatório | Gerenciamento da conta |
| Fotos e vídeos → Fotos | Sim | Opcional | Funcionalidade do app |
| Atividade no app → Outro conteúdo gerado pelo usuário (viagens, checklists, looks, orçamento) | Sim | Obrigatório | Funcionalidade do app |

Para todos: **não** é processado de forma temporária; **não** é usado para
publicidade nem análise.

**Não coletados:** localização, contatos, dados financeiros, mensagens, áudio,
arquivos, calendário, saúde, IDs de dispositivo/publicidade, informações do app
e desempenho.

---

## Outros formulários do painel

- **Anúncios:** o app não contém anúncios.
- **Classificação de conteúdo:** categoria "Todos os outros tipos de app";
  responder "Não" para violência, sexo, linguagem, drogas, apostas e
  interação entre usuários (não há chat nem conteúdo compartilhado com outros usuários).
  Compras digitais: não.
- **Público-alvo:** 18 anos ou mais (evita as exigências extras da política de famílias).
- **App de notícias:** não.
- **Apps governamentais / financeiros / saúde:** não.
- **ID de publicidade:** o app não usa o ID de publicidade.
  Se o Console reclamar da permissão `AD_ID`, adicione em `app.json` →
  `android.blockedPermissions: ["com.google.android.gms.permission.AD_ID"]`.

---

## Publicar as páginas (GitHub Pages)

As páginas `docs/privacy.html` e `docs/delete-account.html` precisam de uma URL
pública. Depois de substituir os itens entre colchetes e fazer push:

1. GitHub → repositório → **Settings → Pages**.
2. Source: *Deploy from a branch* → branch `master`, pasta `/docs` → Save.
3. Em alguns minutos ficam em `https://7haymuller.github.io/my-trip-buddy/privacy.html`.

GitHub Pages só funciona em repositório privado com plano pago. Se o repo for
privado, alternativas: tornar público, criar um repo público só com a pasta
`docs/`, ou hospedar no site da empresa.
