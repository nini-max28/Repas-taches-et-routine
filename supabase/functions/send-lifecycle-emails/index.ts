// Fonction "send-lifecycle-emails" — appelée toutes les 10 minutes par pg_cron.
//
// Envoie, UNE seule fois par famille :
//   - un courriel de bienvenue, dès que le courriel du propriétaire est confirmé ;
//   - un rappel quand l'essai gratuit se termine dans moins de 2 jours.
//
// Les courriels sont envoyés par Resend (domaine planifamille.com déjà vérifié).
// Chaque famille est "réservée" (colonne *_sent_at remplie) AVANT l'envoi : si
// deux passages se chevauchent, un seul courriel part. Si l'envoi échoue, la
// réservation est annulée et ça réessaie au prochain passage.
//
// À déployer avec --no-verify-jwt (appelée par pg_cron, comme check-reminders).

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Planifamille <info@planifamille.com>";
const SITE = "https://planifamille.com";

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

type Pending = { family_id: string; email: string; kind: "welcome" | "trial_ending"; trial_ends_at: string };

function dateIn(lang: "fr-CA" | "en-CA", iso: string) {
  return new Date(iso).toLocaleDateString(lang, { day: "numeric", month: "long", timeZone: "America/Toronto" });
}

// Le courriel est volontairement bilingue (français puis anglais), puisqu'on ne
// connaît pas la langue choisie par la personne côté serveur.
function build(p: Pending) {
  const button = (label: string) =>
    `<p style="margin:18px 0"><a href="${SITE}" style="background:#C97456;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">${label}</a></p>`;
  const wrap = (inner: string) =>
    `<div style="font-family:Helvetica,Arial,sans-serif;color:#3A2A20;max-width:560px;margin:0 auto;padding:8px 4px;line-height:1.55;font-size:15px">${inner}
     <hr style="border:none;border-top:1px solid #EFD9C7;margin:26px 0 12px">
     <p style="font-size:12px;color:#8A6F60">Vous recevez ce message parce que vous avez créé un compte Planifamille. / You are receiving this because you created a Planifamille account.<br>
     <a href="${SITE}/politique-de-confidentialite" style="color:#8A6F60">Politique de confidentialité / Privacy Policy</a> · info@planifamille.com</p></div>`;

  if (p.kind === "welcome") {
    return {
      subject: "Bienvenue sur Planifamille / Welcome to Planifamille",
      html: wrap(`
        <h2 style="margin:0 0 8px">Bienvenue sur Planifamille 🎈</h2>
        <p>Merci de votre confiance, nous sommes heureux de vous accueillir.</p>
        <p><strong>Pourquoi Planifamille?</strong> Organiser une famille, c'est beaucoup à porter : l'épicerie, les repas, les corvées, les routines du matin et du dodo. Planifamille réunit tout ça au même endroit, simplement, pour alléger la charge mentale des parents et faire participer les enfants, avec des routines visuelles, des tâches qui tournent entre les membres de la famille et des défis récompense.</p>
        <p>Votre essai gratuit de 7 jours est en cours, sans carte de crédit.</p>
        <p><strong>Pour bien démarrer :</strong></p>
        <ol style="padding-left:20px"><li>Dans l'onglet <em>Tâches</em>, ajoutez les membres de votre famille.</li>
        <li>Ajoutez vos premiers articles d'épicerie ou piochez des idées de repas.</li>
        <li>Créez une routine ou un défi récompense pour vos enfants.</li></ol>
        ${button("Ouvrir Planifamille")}
        <p>Une question? Répondez à ce courriel ou écrivez-nous à info@planifamille.com.</p>
        <hr style="border:none;border-top:1px dashed #EFD9C7;margin:22px 0">
        <h2 style="margin:0 0 8px">Welcome to Planifamille 🎈</h2>
        <p>Thank you for your trust, we're glad to have you.</p>
        <p><strong>Why Planifamille?</strong> Running a family is a lot to carry: groceries, meals, chores, morning and bedtime routines. Planifamille brings it all together in one simple place, to lighten parents' mental load and get kids involved, with visual routines, chores that rotate between family members, and reward charts.</p>
        <p>Your 7-day free trial is underway, no credit card needed.</p>
        <p><strong>To get started:</strong></p>
        <ol style="padding-left:20px"><li>In the <em>Tasks</em> tab, add your family members.</li>
        <li>Add your first grocery items or pick some meal ideas.</li>
        <li>Create a routine or a reward chart for your children.</li></ol>
        ${button("Open Planifamille")}
        <p>Questions? Reply to this email or write to info@planifamille.com.</p>`),
      text: `Bienvenue sur Planifamille!\n\nMerci de votre confiance, nous sommes heureux de vous accueillir.\n\nPourquoi Planifamille? Organiser une famille, c'est beaucoup à porter : l'épicerie, les repas, les corvées, les routines. Planifamille réunit tout ça au même endroit pour alléger la charge mentale des parents et faire participer les enfants.\n\nVotre essai gratuit de 7 jours est en cours, sans carte de crédit.\n1. Dans l'onglet Tâches, ajoutez les membres de votre famille.\n2. Ajoutez vos premiers articles d'épicerie ou idées de repas.\n3. Créez une routine ou un défi récompense.\n\n${SITE}\nUne question? info@planifamille.com\n\n---\n\nWelcome to Planifamille!\n\nThank you for your trust, we're glad to have you.\n\nWhy Planifamille? Running a family is a lot to carry: groceries, meals, chores, routines. Planifamille brings it all together in one place to lighten parents' mental load and get kids involved.\n\nYour 7-day free trial is underway, no credit card needed.\n1. In the Tasks tab, add your family members.\n2. Add your first grocery items or meal ideas.\n3. Create a routine or a reward chart.\n\n${SITE}\nQuestions? info@planifamille.com`,
    };
  }

  const fr = dateIn("fr-CA", p.trial_ends_at);
  const en = dateIn("en-CA", p.trial_ends_at);
  return {
    subject: `Votre essai gratuit se termine le ${fr} / Your free trial ends on ${en}`,
    html: wrap(`
      <h2 style="margin:0 0 8px">Votre essai gratuit se termine bientôt</h2>
      <p>Votre essai gratuit de Planifamille se termine le <strong>${fr}</strong>.</p>
      <p>Pour continuer à utiliser votre épicerie, vos repas, vos tâches et vos routines, abonnez-vous depuis l'app ou sur planifamille.com. Vous choisissez la formule mensuelle ou annuelle, et les prix sont affichés avant l'achat. Vos données sont conservées, et vous pouvez annuler en tout temps.</p>
      ${button("Ouvrir Planifamille")}
      <hr style="border:none;border-top:1px dashed #EFD9C7;margin:22px 0">
      <h2 style="margin:0 0 8px">Your free trial is ending soon</h2>
      <p>Your Planifamille free trial ends on <strong>${en}</strong>.</p>
      <p>To keep using your groceries, meals, tasks and routines, subscribe from the app or on planifamille.com. You can choose the monthly or annual plan, and prices are shown before you buy. Your data is kept, and you can cancel at any time.</p>
      ${button("Open Planifamille")}`),
    text: `Votre essai gratuit de Planifamille se termine le ${fr}.\nPour continuer, abonnez-vous depuis l'app ou sur planifamille.com (formule mensuelle ou annuelle, prix affichés avant l'achat). Vos données sont conservées; annulation possible en tout temps.\n${SITE}\n\n---\n\nYour Planifamille free trial ends on ${en}.\nTo keep going, subscribe from the app or on planifamille.com (monthly or annual plan, prices shown before you buy). Your data is kept; cancel any time.\n${SITE}`,
  };
}

Deno.serve(async () => {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY manquante — aucun courriel envoyé.");
    return new Response(JSON.stringify({ error: "RESEND_API_KEY manquante" }), { status: 500 });
  }

  const { data: pending, error } = await admin.rpc("lifecycle_emails_pending");
  if (error) {
    console.error("Erreur lecture des courriels à envoyer:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0, failed = 0;
  for (const p of (pending || []) as Pending[]) {
    const column = p.kind === "welcome" ? "welcome_sent_at" : "trial_reminder_sent_at";

    // Réserve cette famille avant l'envoi : si une autre exécution l'a déjà
    // prise, la mise à jour ne retourne rien et on passe.
    const { data: claimed } = await admin.from("families")
      .update({ [column]: new Date().toISOString() })
      .eq("id", p.family_id).is(column, null).select("id");
    if (!claimed || claimed.length === 0) continue;

    try {
      const msg = build(p);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [p.email], subject: msg.subject, html: msg.html, text: msg.text }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
      sent++;
    } catch (err: any) {
      failed++;
      console.error("Envoi échoué:", err?.message);
      // Annule la réservation pour réessayer au prochain passage.
      await admin.from("families").update({ [column]: null }).eq("id", p.family_id);
    }
  }

  return new Response(JSON.stringify({ sent, failed }), { headers: { "Content-Type": "application/json" } });
});
