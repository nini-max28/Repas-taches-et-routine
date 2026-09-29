// Fonction "delete-account" — appelée par le bouton "Supprimer mon compte" de
// l'app (exigé par Apple pour toute app qui permet de créer un compte).
//
// Ce qu'elle fait, dans l'ordre :
//  1. Identifie la personne à partir de son jeton de connexion (jamais à
//     partir d'un identifiant envoyé par l'app, pour que personne ne puisse
//     supprimer le compte de quelqu'un d'autre).
//  2. Annule son abonnement Stripe s'il y en a un (pour ne plus la facturer).
//  3. Supprime la famille — toutes les tables (membres, tâches, épicerie,
//     routines, défis, réglages, notifications...) se vident automatiquement
//     avec elle.
//  4. Supprime le compte de connexion lui-même.
//
// Un abonnement pris via Apple ne peut pas être annulé par nous : l'app le
// rappelle à la personne avant la suppression.

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@16";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

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
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) return json({ success: false, error: "Non authentifié" }, 401);
    const userId = userData.user.id;

    // Trouve la famille de cette personne, et si elle en est la propriétaire.
    const { data: familyUser } = await admin.from("family_users").select("family_id").eq("user_id", userId).maybeSingle();
    if (familyUser) {
      const { data: family } = await admin.from("families").select("*").eq("id", familyUser.family_id).single();

      if (family && family.owner_user_id === userId) {
        // Annule l'abonnement Stripe d'abord — si ça échoue pour une raison
        // autre que "déjà annulé", on s'arrête AVANT de rien supprimer, pour
        // ne jamais laisser quelqu'un facturé sans compte.
        if (family.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(family.stripe_subscription_id);
          } catch (err: any) {
            if (err?.code !== "resource_missing") {
              return json({ success: false, error: "Impossible d'annuler l'abonnement pour l'instant. Réessayez, ou écrivez-nous." }, 500);
            }
          }
        }
        // Supprime la famille : tout le reste part en cascade.
        const { error: delFamilyError } = await admin.from("families").delete().eq("id", family.id);
        if (delFamilyError) throw delFamilyError;
      }
    }

    // Supprime le compte de connexion (et ce qui y est encore rattaché).
    const { error: delUserError } = await admin.auth.admin.deleteUser(userId);
    if (delUserError) throw delUserError;

    return json({ success: true });
  } catch (err: any) {
    console.error("Erreur suppression de compte:", err?.message);
    return json({ success: false, error: err?.message || "Erreur inconnue" }, 500);
  }
});
