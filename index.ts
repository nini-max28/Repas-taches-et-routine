// Fonction "notify" — envoie un SMS et/ou une notification push à un membre,
// et gère les abonnements aux notifications push (activer/désactiver).
// Appelée directement depuis le navigateur (événements instantanés, ex. "c'est
// ton tour") ET depuis la fonction "check-reminders" (vérifications planifiées).

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER") || "";
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contact@example.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function sendSms(to: string, body: string) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) throw new Error("Twilio non configuré");
  const auth = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function sendPushToMember(memberId: string, title: string, body: string) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return 0;
  const { data: subs } = await admin.from("push_subscriptions").select("*").eq("member_id", memberId);
  let sent = 0;
  for (const s of subs || []) {
    try {
      await webpush.sendNotification(s.subscription, JSON.stringify({ title, body }));
      sent++;
    } catch (e: any) {
      if (e.statusCode === 404 || e.statusCode === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
    }
  }
  return sent;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { action } = payload;

    if (action === "vapid-public-key") {
      return json({ success: true, publicKey: VAPID_PUBLIC });
    }

    if (action === "subscribe") {
      const { memberId, subscription } = payload;
      const { data: member } = await admin.from("members").select("family_id").eq("id", memberId).single();
      if (!member) return json({ success: false, error: "Membre introuvable" }, 400);
      const { error } = await admin.from("push_subscriptions").upsert(
        { member_id: memberId, family_id: member.family_id, endpoint: subscription.endpoint, subscription },
        { onConflict: "endpoint" }
      );
      if (error) return json({ success: false, error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "unsubscribe") {
      const { endpoint } = payload;
      await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
      return json({ success: true });
    }

    if (action === "send") {
      // slotKey (optionnel) : si fourni, évite d'envoyer deux fois le même
      // rappel pour la même tâche au même moment.
      const { memberId, title, body, slotKey, taskId, notifyParent, familyId } = payload;

      if (slotKey && taskId) {
        const { error: dupError } = await admin.from("reminder_log").insert({ family_id: familyId, task_id: taskId, slot_key: slotKey });
        if (dupError) return json({ success: true, skipped: "déjà envoyé" }); // conflit = déjà envoyé
      }

      const { data: member } = await admin.from("members").select("*").eq("id", memberId).single();
      if (!member) return json({ success: false, error: "Membre introuvable" }, 400);

      const { data: settings } = await admin.from("settings").select("*").eq("family_id", member.family_id).single();
      const channel = settings?.task_notify_channel || "both";

      let smsSent = false;
      if ((channel === "both" || channel === "sms") && member.phone) {
        try { await sendSms(member.phone, body); smsSent = true; } catch (e) { console.error("Erreur SMS:", e); }
      }
      const pushSent = (channel === "both" || channel === "push") ? await sendPushToMember(memberId, title, body) : 0;

      if (notifyParent) {
        const phones = [settings?.phone1, settings?.phone2, settings?.phone3, settings?.phone4].filter(Boolean);
        for (const phone of phones) {
          try { await sendSms(phone, `👀 ${member.name} — ${body}`); } catch (e) { console.error("Erreur SMS parent:", e); }
        }
      }

      return json({ success: true, smsSent, pushSent });
    }

    if (action === "broadcast") {
      const { familyId, body } = payload;
      const { data: settings } = await admin.from("settings").select("*").eq("family_id", familyId).maybeSingle();
      const phones = [settings?.phone1, settings?.phone2, settings?.phone3, settings?.phone4].filter(Boolean);
      let sent = 0;
      for (const phone of phones) {
        try { await sendSms(phone, body); sent++; } catch (e) { console.error("Erreur SMS diffusion:", e); }
      }
      return json({ success: true, sent });
    }

    if (action === "test") {
      const { memberId } = payload;
      const pushSent = await sendPushToMember(memberId, "Notification de test", "Ceci est une notification de test 🎉");
      return json({ success: pushSent > 0, pushSent });
    }

    return json({ success: false, error: "Action inconnue" }, 400);
  } catch (err: any) {
    return json({ success: false, error: err.message }, 500);
  }
});
