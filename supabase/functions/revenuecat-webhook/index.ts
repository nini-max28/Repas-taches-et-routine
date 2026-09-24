// Fonction "revenuecat-webhook" — reçoit les événements d'abonnement pour les
// achats faits DANS l'app iOS (via Apple), et garde la colonne
// "subscription_status" de la famille à jour, exactement comme le webhook
// Stripe le fait pour les abonnements pris sur le site web.
//
// IMPORTANT : à déployer avec --no-verify-jwt, puisque RevenueCat ne peut pas
// fournir de jeton Supabase — le secret partagé (vérifié ci-dessous) est la
// vraie protection contre les faux appels.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

// Fait correspondre l'identifiant de produit Apple au nom de plan qu'on garde
// déjà dans la base de données (le même champ que pour Stripe).
function planFromProductId(productId: string): string {
  if (productId?.includes("annual")) return "annual";
  return "monthly";
}

Deno.serve(async (req) => {
  // RevenueCat envoie exactement ce qui a été tapé dans le champ "Authorization
  // header" de son tableau de bord — pas de préfixe "Bearer" ajouté
  // automatiquement comme le fait Stripe. On accepte les deux formats, pour ne
  // pas dépendre de la façon exacte dont le champ a été rempli.
  const authHeader = (req.headers.get("Authorization") || "").trim();
  if (authHeader !== REVENUECAT_WEBHOOK_SECRET && authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
  }

  try {
    const body = await req.json();
    const event = body.event;
    if (!event) return new Response(JSON.stringify({ received: true }));

    // app_user_id correspond à l'id de l'utilisateur Supabase — voir
    // Purchases.logIn() côté app, qui fait exactement cette correspondance.
    const appUserId = event.app_user_id;
    const productId = event.product_id;
    const eventType = event.type;

    const { data: familyUser } = await admin
      .from("family_users")
      .select("family_id")
      .eq("user_id", appUserId)
      .single();

    if (!familyUser) {
      // Rien à mettre à jour si on ne sait pas de quelle famille il s'agit
      // (ex. un événement de test envoyé depuis le tableau de bord RevenueCat).
      return new Response(JSON.stringify({ received: true, note: "famille introuvable" }));
    }

    const familyId = familyUser.family_id;

    switch (eventType) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION":
      case "PRODUCT_CHANGE":
        await admin.from("families").update({
          subscription_status: "active",
          plan: planFromProductId(productId),
        }).eq("id", familyId);
        break;

      case "EXPIRATION":
        await admin.from("families").update({ subscription_status: "cancelled" }).eq("id", familyId);
        break;

      case "BILLING_ISSUE":
        await admin.from("families").update({ subscription_status: "past_due" }).eq("id", familyId);
        break;

      // "CANCELLATION" veut dire que la personne a annulé le renouvellement,
      // mais elle garde l'accès jusqu'à la fin de la période déjà payée — pas
      // besoin de rien changer tout de suite, "EXPIRATION" s'occupera de
      // couper l'accès au bon moment.
    }

    return new Response(JSON.stringify({ received: true }));
  } catch (err: any) {
    console.error("Erreur webhook RevenueCat:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
