# ✈️ My Trip Buddy

App para organizar viagens já reservadas, pensado para quem fica ansioso antes de viajar. Reúne em um só lugar as informações da viagem:

- voos, hotéis, roteiro por dia, checklist, orçamento e looks
- uma contagem regressiva para a partida
- avisos de visto

Feito com React Native, Expo e TypeScript, com sincronização no Supabase.

---

## Funcionalidades

### Login
- Entrar com **Google** ou por **e-mail**, com link de acesso ou código de 6 dígitos (Supabase Auth).

### Criar e editar viagem
Formulário em 3 etapas:

1. **Sobre a viagem:** nome, destinos (um por vez), país do passaporte e datas de partida e retorno, com o total de noites calculado.
2. **Voos e hotéis:**
   - Voos por destino: número do voo e data. A partir da data do voo, o destino entra sozinho no itinerário.
   - Hotéis por destino: nome, período de check-in e check-out e código de confirmação.
3. **Revisão:** resumo da viagem, avisos de visto e prévia do checklist gerado.

Viagens podem ser editadas ou excluídas depois.

### Home
- **Contagem regressiva** até a partida, em dias, horas, minutos e segundos.
- **Capa da viagem** com foto da galeria, que pode ser trocada.
- **Mapa-múndi** com pins nos destinos, além do total de destinos e noites.
- **Aviso de visto** com base no passaporte e nos destinos (ex.: EUA, Canadá, Índia, Turquia, Vietnã).
- **Checklist** gerado automaticamente por categoria (docs, voo, hotel, looks, visto e outros). Ele se adapta à viagem:
  - "Reservar hotel" se ainda não há hospedagem
  - câmbio em espécie para destinos onde se usa muito dinheiro vivo
  - vacinas para destinos que pedem
  - pedido de visto quando necessário

  Também é possível adicionar itens próprios e marcar os concluídos.
- **Hospedagens** com foto do local (Google Street View), endereço, datas, noites, código de confirmação e link para o Google Maps.
- **Confirmações** de voos e hotéis.
- Atalho para o **orçamento**.

### Viagens
- Lista de todas as viagens, com tela vazia ilustrada para criar a primeira.

### Itinerário
- **Carrossel de dias** da viagem, incluindo uma aba "sem data".
- **Mapa interativo** (Leaflet + OpenStreetMap) com os destinos do dia, cada país com uma cor.
- **Busca de lugares** (Photon / OpenStreetMap) para adicionar pontos de visitação a cada dia.
- Toque em um destino para abrir a rota no **Google Maps** a partir da sua localização, ou abra a **rota do dia** inteira.
- **Modo offline:** sem internet, mostra a lista do dia, sem mapa e sem busca.

### Looks
- **Pastas por país** da viagem, com os looks organizados por dia.
- Adicionar looks da **galeria** do celular.
- **Inspirações para o destino** via Unsplash, com busca e seleção de vários looks de uma vez.
- Atalho para buscar looks no **Pinterest** com termos do destino.
- Visualizador de looks em tela cheia.

### Orçamento
- Orçamento total na moeda escolhida, com valor gasto, restante e quanto passou do limite.
- **Despesas** com valor, moeda, categoria (transporte, hospedagem, alimentação, passeios, compras e outros), dia e nota.
- **Conversão automática de moeda** pela API Frankfurter. O app avisa quando alguma despesa não pôde ser convertida.
- Gastos agrupados por categoria.

### Perfil e notificações
- **Lembretes de contagem regressiva:** escolha de quantos dias antes avisar (50, 40, 30, 20, 10, 5 ou 1) ou um valor personalizado.
- Sair da conta.

### Geral
- **Idiomas:** português e inglês.
- **Sincronização na nuvem:** viagens, checklist, looks e lugares ficam salvos no aparelho (AsyncStorage) e são sincronizados com o Supabase. As imagens vão para o Supabase Storage.
- **Cache** de dados de hotéis e voos para reduzir chamadas às APIs.

---

## Stack

| Área | Tecnologias |
| --- | --- |
| Base | Expo 54, React Native 0.81, React 19, TypeScript, Expo Router |
| Dados e auth | Supabase (Postgres, Auth, Storage), AsyncStorage, Google Sign-In |
| Mapas | Leaflet + OpenStreetMap (WebView), d3-geo + world-atlas (mapa-múndi), Photon (geocoding) |
| APIs | Google Street View, Unsplash, Frankfurter (câmbio), AirLabs (voos) |
| UI | Reanimated, Gesture Handler, Bottom Sheet, Linear Gradient, SVG, Haptics |
| Outros | expo-notifications, NetInfo, i18next, date-fns |

---

## Estrutura

```
app/
  (tabs)/            Home, Viagens, Itinerário, Looks, Perfil
  trip-form.tsx      Criar/editar viagem
  budget.tsx         Orçamento
  pinterest-picker.tsx  Seleção de looks (galeria, Unsplash, Pinterest)
  looks-days.tsx, look-viewer.tsx
  login.tsx
components/          Mapas, calendários, cards, seletores
hooks/               useTrips (estado e sincronização), useAuth, useCountdown, useNetworkStatus
utils/               Integrações (supabase, currency, geocode, hotelDataService,
                     flightService, unsplash, pinterest, visa, notifications)
i18n/locales/        pt e en
supabase_migration.sql, supabase_storage_migration.sql
```

---

## Como rodar

### Pré-requisitos
- Node.js 20+
- Android Studio ou Xcode. O app usa módulos nativos (Google Sign-In), então precisa de um development build. Não roda no Expo Go.
- Projeto no Supabase

### Supabase
No SQL Editor, rode:
1. `supabase_migration.sql`, que cria a tabela `app_data`
2. `supabase_storage_migration.sql`, que cria o bucket `trip-images`

### Variáveis de ambiente
Crie um `.env` na raiz:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=          # Street View das hospedagens
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=      # inspirações de looks
```

Sem o Supabase configurado, o app funciona só com o armazenamento local.

### Executar

```bash
npm install
npm run android    # ou: npm run ios
```

Builds com EAS: perfis `development`, `preview` (APK) e `production` em `eas.json`.
