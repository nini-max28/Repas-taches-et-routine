// Fonction "check-reminders" — tourne automatiquement toutes les 30 minutes
// (via pg_cron, voir 06-cron.sql) et vérifie, pour TOUTES les familles à la
// fois, quelles routines ou tâches ont besoin d'un rappel maintenant.
//
// Version de départ (v1) : un rappel par créneau, sans les relances multiples
// ni le rattrapage d'absence qu'avait l'ancien système — ça pourra s'enrichir
// une fois que le reste fonctionne bien.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function callNotify(payload: Record<string, unknown>) {
  await admin.functions.invoke("notify", { body: payload });
}

function localParts(tz: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "numeric", minute: "numeric", weekday: "short", hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const hour = Number(get("hour")) % 24;
  return {
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    hour,
    minute: Number(get("minute")),
    weekday: get("weekday"), // "Mon", "Tue", ...
  };
}

const ROUTINE_TITLES = ["🎈 C'est l'heure!", "🌟 On y va!", "✨ Prêt(e)?"];
const ROUTINE_BODIES = (name: string, task: string) => [
  `${name}, c'est l'heure de "${task}"!`,
  `Allez ${name}, "${task}" t'attend!`,
];
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

Deno.serve(async () => {
  const TIMEZONE = "America/Toronto";
  const { dateStr, hour, minute } = localParts(TIMEZONE);
  const roundedMinute = minute < 30 ? 0 : 30;
  const currentTime = `${String(hour).padStart(2, "0")}:${String(roundedMinute).padStart(2, "0")}`;

  const { data: families } = await admin.from("families").select("id");
  let notified = 0;

  for (const family of families || []) {
    // --- Routines visuelles avec une heure de rappel précise ---
    const { data: routines } = await admin.from("tasks").select("*").eq("family_id", family.id).eq("type", "routine").not("notify_time", "is", null);
    for (const task of routines || []) {
      if (task.notify_time !== currentTime) continue;
      const checkedToday: string[] = (task.checked_steps || {})[dateStr] || [];
      const steps = task.steps || [];
      if (steps.length > 0 && checkedToday.length >= steps.length) continue; // déjà faite

      const { data: member } = await admin.from("members").select("*").eq("id", task.assigned_to).maybeSingle();
      if (!member) continue;

      await callNotify({
        action: "send",
        familyId: family.id,
        taskId: task.id,
        slotKey: `${dateStr}:${currentTime}`,
        memberId: member.id,
        title: pick(ROUTINE_TITLES),
        body: pick(ROUTINE_BODIES(member.name, task.title)),
        notifyParent: task.notify_parent,
      });
      notified++;
    }

    // --- Tâches simples et en alternance : créneaux matin/après-midi/soir ---
    const { data: settingsRow } = await admin.from("settings").select("*").eq("family_id", family.id).maybeSingle();
    const morningHour = settingsRow?.morning_reminder_hour ?? 7;
    const afternoonHour = settingsRow?.afternoon_reminder_hour ?? 16;
    const eveningHour = settingsRow?.evening_reminder_hour ?? 19;
    const isReminderHour = [morningHour, afternoonHour, eveningHour].some((h) => h === hour && roundedMinute === 0);
    if (!isReminderHour) continue;

    const slot = hour === morningHour ? "matin" : hour === afternoonHour ? "apres-midi" : "soir";
    const { data: chores } = await admin.from("tasks").select("*").eq("family_id", family.id).neq("type", "routine");

    for (const task of chores || []) {
      let memberId: string | null = null;
      if (task.rotation && task.rotation.length) {
        memberId = task.rotation[task.rotation_index % task.rotation.length];
      } else if (task.frequency === "quotidien" && task.last_done_date !== dateStr) {
        memberId = task.assigned_to;
      } else if ((task.frequency === "hebdomadaire" || task.frequency === "auxDeuxSemaines") && !task.last_done_date) {
        memberId = task.assigned_to;
      }
      if (!memberId) continue;

      const { data: member } = await admin.from("members").select("*").eq("id", memberId).maybeSingle();
      if (!member) continue;

      await callNotify({
        action: "send",
        familyId: family.id,
        taskId: task.id,
        slotKey: `${dateStr}:${slot}`,
        memberId: member.id,
        title: "📋 Une tâche t'attend",
        body: `${member.name}, "${task.title}" n'est pas encore fait!`,
        notifyParent: task.notify_parent,
      });
      notified++;
    }
  }

  return new Response(JSON.stringify({ success: true, notified }), { headers: { "Content-Type": "application/json" } });
});
