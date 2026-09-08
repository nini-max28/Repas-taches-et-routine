// Fonction "stripe-webhook" — Stripe l'appelle directement (pas l'app) chaque
// fois qu'un paiement réussit, échoue, ou qu'un abonnement change. C'est ce
// qui garde la colonne "subscription_status" de chaque famille à jour.
//
// IMPORTANT : cette fonction doit être déployée avec --no-verify-jwt puisque
// Stripe ne peut pas fournir de jeton Supabase — sa propre signature (vérifiée
// ci-dessous) est la vraie protection contre les faux appels.

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@16";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function updateFamilyByCustomer(customerId: string, patch: Record<string, unknown>) {
  await admin.from("families").update(patch).eq("stripe_customer_id", customerId);
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text(); // le corps BRUT est nécessaire pour vérifier la signature

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Signature Stripe invalide:", err.message);
    return new Response(`Erreur de signature : ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const plan = session.metadata?.plan || "monthly";
        await updateFamilyByCustomer(customerId, {
          subscription_status: "active",
          stripe_subscription_id: session.subscription as string,
          plan,
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : sub.status;
        await updateFamilyByCustomer(sub.customer as string, { subscription_status: status });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateFamilyByCustomer(sub.customer as string, { subscription_status: "cancelled" });
        break;
      }
    }
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("Erreur traitement webhook:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
