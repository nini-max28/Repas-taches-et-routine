// Fonction "create-portal-session" — pour le bouton "Gérer mon abonnement".
// Ouvre le portail Stripe où la personne peut changer de carte, annuler, ou
// voir ses factures — sans qu'on ait besoin de construire cet écran nous-mêmes.

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@16";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) return json({ success: false, error: "Non authentifié" }, 401);

    const { data: familyUser } = await admin.from("family_users").select("family_id").eq("user_id", userData.user.id).single();
    if (!familyUser) return json({ success: false, error: "Famille introuvable" }, 400);

    const { data: family } = await admin.from("families").select("stripe_customer_id").eq("id", familyUser.family_id).single();
    if (!family?.stripe_customer_id) return json({ success: false, error: "Aucun abonnement à gérer pour l'instant." }, 400);

    const session = await stripe.billingPortal.sessions.create({
      customer: family.stripe_customer_id,
      return_url: `${APP_URL}/`,
    });

    return json({ success: true, url: session.url });
  } catch (err: any) {
    return json({ success: false, error: err.message }, 500);
  }
});
