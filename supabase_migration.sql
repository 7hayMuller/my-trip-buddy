-- Criar tabela app_data para sincronizar dados do app
CREATE TABLE IF NOT EXISTS public.app_data (
  device_id TEXT PRIMARY KEY,
  trips JSONB NOT NULL DEFAULT '[]'::jsonb,
  checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  looks JSONB NOT NULL DEFAULT '[]'::jsonb,
  places JSONB NOT NULL DEFAULT '[]'::jsonb,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir insert/update para qualquer device_id (anon)
CREATE POLICY "Allow insert and update for all"
ON public.app_data
FOR ALL
USING (true)
WITH CHECK (true);

-- Policy: Permitir select para todos (anon)
CREATE POLICY "Allow select for all"
ON public.app_data
FOR SELECT
USING (true);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_app_data_device_id ON public.app_data(device_id);
CREATE INDEX IF NOT EXISTS idx_app_data_synced_at ON public.app_data(synced_at);
