// Fonction "create-checkout-session" — appelée quand quelqu'un clique
// "S'abonner" dans l'app. Crée (ou réutilise) le client Stripe de la famille,
// puis une session de paiement Stripe, et retourne le lien à ouvrir.

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@16";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const PRICE_MONTHLY = Deno.env.get("STRIPE_PRICE_MONTHLY")!;
const PRICE_ANNUAL = Deno.env.get("STRIPE_PRICE_ANNUAL")!;
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
    // Identifie l'utilisateur connecté à partir du jeton envoyé automatiquement
    // par supabase.functions.invoke() — nécessaire pour savoir quelle famille
    // doit être abonnée.
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) return json({ success: false, error: "Non authentifié" }, 401);

    const { data: familyUser } = await admin.from("family_users").select("family_id").eq("user_id", userData.user.id).single();
    if (!familyUser) return json({ success: false, error: "Famille introuvable" }, 400);

    const { data: family } = await admin.from("families").select("*").eq("id", familyUser.family_id).single();
    if (!family) return json({ success: false, error: "Famille introuvable" }, 400);

    const { plan } = await req.json(); // "monthly" | "annual"
    const priceId = plan === "annual" ? PRICE_ANNUAL : PRICE_MONTHLY;

    // Crée le client Stripe une seule fois, puis le réutilise à chaque fois.
    let customerId = family.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: userData.user.email, metadata: { family_id: family.id } });
      customerId = customer.id;
      await admin.from("families").update({ stripe_customer_id: customerId }).eq("id", family.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/?abonnement=succes`,
      cancel_url: `${APP_URL}/?abonnement=annule`,
      metadata: { family_id: family.id, plan },
    });

    return json({ success: true, url: session.url });
  } catch (err: any) {
    return json({ success: false, error: err.message }, 500);
  }
});
