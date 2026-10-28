// Estende o app.json com valores que não podem ir pro repositório.
//
// GOOGLE_MAPS_ANDROID_KEY vem do .env (local) ou das variáveis do EAS (builds
// da loja). Ela fica no AndroidManifest — é inevitável pro SDK nativo do Maps —
// por isso a chave é restrita no Google Cloud ao pacote + SHA-1 do app e só à
// Maps SDK for Android. Não é a mesma chave da Places (essa fica só no
// Supabase, ver supabase/functions/places).
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY ?? "" },
    },
  },
});
