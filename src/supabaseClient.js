import { createClient } from "@supabase/supabase-js";

// Ces deux valeurs sont sans danger à exposer publiquement — la vraie sécurité
// vient des règles RLS (Row Level Security) déjà appliquées sur chaque table,
// qui garantissent qu'une famille ne peut jamais voir les données d'une autre.
const SUPABASE_URL = "https://hhpstmqslnuhhakolwkf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_RHcpp_xplMpKHJw2PUqKJQ_5crYDqmv";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
