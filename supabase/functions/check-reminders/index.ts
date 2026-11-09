// Fonction "check-reminders" — tourne automatiquement toutes les 30 minutes
// (via pg_cron, voir 06-cron.sql) et vérifie, pour TOUTES les familles à la
// fois, quelles routines, tâches, médicaments ou rendez-vous ont besoin d'un
// rappel maintenant.
//
// Conçue pour grandir : le nombre de requêtes à la base de données est FIXE
// (environ 7, peu importe le nombre de familles), les lectures sont découpées
// en pages de 1 000 lignes (limite de Supabase) et les envois se font en
// parallèle, quelques-uns à la fois. Les anciennes versions faisaient 4 à 6
// requêtes PAR famille, l'une après l'autre.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const PAGE_SIZE = 1000; // Supabase ne renvoie jamais plus de 1 000 lignes par requête
const ID_CHUNK = 100;   // nombre d'identifiants par requête .in(...) (évite les adresses trop longues)
const CONCURRENCY = 8;  // nombre d'envois faits en même temps

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;
type Job = () => Promise<void>;

function localParts(tz: string, now: Date) {
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

function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
// "14:30" -> "14 h 30", "09:00" -> "9 h"
function formatTimeFr(t: string): string {
  const [h, m] = t.split(":");
  return m && m !== "00" ? `${Number(h)} h ${m}` : `${Number(h)} h`;
}

const ROUTINE_TITLES = ["🎈 C'est l'heure!", "🌟 On y va!", "✨ Prêt(e)?"];
const ROUTINE_BODIES = (name: string, task: string) => [
  `${name}, c'est l'heure de "${task}"!`,
  `Allez ${name}, "${task}" t'attend!`,
];
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Lit TOUTES les lignes d'une requête, page par page (1 000 lignes à la fois).
// En cas d'erreur, on le note dans les journaux et on continue avec ce qu'on a :
// une table qui pose problème ne doit pas bloquer tous les autres rappels.
async function selectAll(
  label: string,
  // deno-lint-ignore no-explicit-any
  build: (from: number, to: number) => PromiseLike<{ data: any; error: { message: string } | null }>,
): Promise<Row[]> {
  const rows: Row[] = [];
  try {
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await build(from, from + PAGE_SIZE - 1);
      if (error) { console.error(`Lecture "${label}" échouée:`, error.message); break; }
      rows.push(...(data || []));
      if (!data || data.length < PAGE_SIZE) break;
    }
  // deno-lint-ignore no-explicit-any
  } catch (e: any) {
    console.error(`Lecture "${label}" échouée:`, e?.message || e);
  }
  return rows;
}

// Exécute les envois en parallèle, CONCURRENCY à la fois. Un envoi qui échoue
// n'empêche jamais les autres.
async function runPool(jobs: Job[], limit: number) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      // deno-lint-ignore no-explicit-any
      try { await job(); } catch (e: any) { console.error("Rappel échoué:", e?.message || e); }
    }
  });
  await Promise.all(workers);
}

// deno-lint-ignore no-explicit-any
export async function run(db: any, now: Date = new Date()) {
  const started = Date.now();
  const TIMEZONE = "America/Toronto";
  const { dateStr, hour, minute } = localParts(TIMEZONE, now);
  const roundedMinute = minute < 30 ? 0 : 30;
  const currentTime = `${String(hour).padStart(2, "0")}:${String(roundedMinute).padStart(2, "0")}`;
  const tomorrow = addDaysStr(dateStr, 1);

  // deno-lint-ignore no-explicit-any
  async function callNotify(payload: Record<string, unknown>) {
    const { error } = await db.functions.invoke("notify", { body: payload });
    if (error) console.error("notify a échoué:", error.message || error);
  }

  // ---------- 1. Familles et heures de rappel (2 lectures au total) ----------
  const families = await selectAll("families", (from, to) => db.from("families").select("id").order("id").range(from, to));
  const familyIds: string[] = families.map((f) => f.id);
  const settingsRows = await selectAll("settings", (from, to) =>
    db.from("settings").select("family_id, morning_reminder_hour, afternoon_reminder_hour, evening_reminder_hour").order("family_id").range(from, to));
  const settingsByFamily = new Map<string, Row>(settingsRows.map((s) => [s.family_id, s]));
  const hoursOf = (familyId: string) => {
    const s = settingsByFamily.get(familyId);
    return { morning: s?.morning_reminder_hour ?? 7, afternoon: s?.afternoon_reminder_hour ?? 16, evening: s?.evening_reminder_hour ?? 19 };
  };

  // ---------- 2. Ce qui est à envoyer maintenant : une lecture par type, pour toutes les familles ----------
  const [routineRows, medRows, apptRows] = await Promise.all([
    selectAll("routines", (from, to) =>
      db.from("tasks").select("*").eq("type", "routine").not("notify_time", "is", null).order("id").range(from, to)),
    selectAll("médicaments", (from, to) =>
      db.from("health_medications").select("*").eq("active", true).lte("start_date", dateStr).order("id").range(from, to)),
    selectAll("rendez-vous", (from, to) =>
      db.from("health_appointments").select("*").eq("appointment_date", tomorrow).is("reminder_sent_at", null).order("id").range(from, to)),
  ]);

  // Tâches simples et en alternance : seulement pour les familles dont c'est un créneau de rappel.
  const reminderFamilyIds = familyIds.filter((fid) => {
    const h = hoursOf(fid);
    return roundedMinute === 0 && [h.morning, h.afternoon, h.evening].some((x) => x === hour);
  });
  const choreRows: Row[] = [];
  for (const part of chunk(reminderFamilyIds, ID_CHUNK)) {
    choreRows.push(...await selectAll("tâches", (from, to) =>
      db.from("tasks").select("*").in("family_id", part).neq("type", "routine").order("id").range(from, to)));
  }

  // ---------- 3. Qui est concerné : on garde seulement ce qui doit partir maintenant ----------
  const dueRoutines: { task: Row; memberId: string }[] = [];
  for (const task of routineRows) {
    if (task.notify_time !== currentTime) continue;
    const checkedToday: string[] = (task.checked_steps || {})[dateStr] || [];
    const steps = task.steps || [];
    if (steps.length > 0 && checkedToday.length >= steps.length) continue; // déjà faite
    dueRoutines.push({ task, memberId: task.assigned_to });
  }

  const dueMeds: Row[] = [];
  for (const med of medRows) {
    if (med.end_date && med.end_date < dateStr) continue;
    const times: string[] = med.times || [];
    if (!times.includes(currentTime)) continue;
    dueMeds.push(med);
  }

  const dueAppts: Row[] = [];
  for (const appt of apptRows) {
    if (hour >= hoursOf(appt.family_id).afternoon) dueAppts.push(appt);
  }

  const dueChores: { task: Row; memberId: string; slot: string }[] = [];
  for (const task of choreRows) {
    const h = hoursOf(task.family_id);
    const slot = hour === h.morning ? "matin" : hour === h.afternoon ? "apres-midi" : "soir";
    let memberId: string | null = null;
    if (task.on_demand) {
      // Tâche "à la demande" : aucun rappel tant qu'un parent ne l'a pas demandée.
      if (!task.requested) continue;
      memberId = task.rotation && task.rotation.length
        ? task.rotation[task.rotation_index % task.rotation.length]
        : task.assigned_to;
    } else if (task.rotation && task.rotation.length) {
      memberId = task.rotation[task.rotation_index % task.rotation.length];
    } else if (task.frequency === "quotidien" && task.last_done_date !== dateStr) {
      memberId = task.assigned_to;
    } else if ((task.frequency === "hebdomadaire" || task.frequency === "auxDeuxSemaines") && !task.last_done_date) {
      memberId = task.assigned_to;
    }
    if (!memberId) continue;
    dueChores.push({ task, memberId, slot });
  }

  // ---------- 4. Les membres concernés : une seule lecture groupée ----------
  const memberIds = new Set<string>();
  for (const r of dueRoutines) if (r.memberId) memberIds.add(r.memberId);
  for (const m of dueMeds) if (m.member_id) memberIds.add(m.member_id);
  for (const a of dueAppts) if (a.member_id) memberIds.add(a.member_id);
  for (const c of dueChores) memberIds.add(c.memberId);
  const memberRows: Row[] = [];
  for (const part of chunk([...memberIds], ID_CHUNK)) {
    memberRows.push(...await selectAll("membres", (from, to) => db.from("members").select("*").in("id", part).order("id").range(from, to)));
  }
  const memberById = new Map<string, Row>(memberRows.map((m) => [m.id, m]));

  // ---------- 5. Les envois, en parallèle ----------
  let notified = 0;
  const jobs: Job[] = [];

  // Médicaments : une alerte au moment précis de chaque prise prévue, envoyée aux
  // parents, jamais deux fois pour la même prise (journal health_medication_log).
  for (const med of dueMeds) {
    jobs.push(async () => {
      const { error: logError } = await db.from("health_medication_log")
        .insert({ medication_id: med.id, dose_date: dateStr, dose_time: currentTime });
      if (logError) return; // déjà envoyée pour cette prise (contrainte unique)
      const member = memberById.get(med.member_id);
      const childName = member?.name || "un enfant";
      await callNotify({
        action: "broadcast",
        familyId: med.family_id,
        body: `💊 C'est l'heure du médicament de ${childName} : ${med.name}${med.dosage ? ` (${med.dosage})` : ""}.`,
      });
      notified++;
    });
  }

  // Rendez-vous : un rappel la veille, à partir de l'heure "après-midi" des réglages
  // (16 h par défaut), à la personne concernée ET aux parents. Une seule fois par
  // rendez-vous : on "réserve" le rendez-vous (reminder_sent_at) avant d'envoyer.
  for (const appt of dueAppts) {
    jobs.push(async () => {
      const { data: claimed } = await db.from("health_appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", appt.id).is("reminder_sent_at", null).select("id");
      if (!claimed || claimed.length === 0) return;
      const member = memberById.get(appt.member_id);
      if (!member) return;
      const when = appt.appointment_time ? ` à ${formatTimeFr(appt.appointment_time)}` : "";
      const where = appt.location ? ` (${appt.location})` : "";
      await callNotify({
        action: "send",
        familyId: appt.family_id,
        memberId: member.id,
        title: "🩺 Rendez-vous demain",
        body: `${member.name} : ${appt.title} demain${when}${where}.`,
        notifyParent: true,
      });
      notified++;
    });
  }

  // Routines visuelles avec une heure de rappel précise.
  for (const { task, memberId } of dueRoutines) {
    jobs.push(async () => {
      const member = memberById.get(memberId);
      if (!member) return;
      await callNotify({
        action: "send",
        familyId: task.family_id,
        taskId: task.id,
        slotKey: `${dateStr}:${currentTime}`,
        memberId: member.id,
        title: pick(ROUTINE_TITLES),
        body: pick(ROUTINE_BODIES(member.name, task.title)),
        notifyParent: task.notify_parent,
      });
      notified++;
    });
  }

  // Tâches simples et en alternance : créneaux matin / après-midi / soir.
  for (const { task, memberId, slot } of dueChores) {
    jobs.push(async () => {
      const member = memberById.get(memberId);
      if (!member) return;
      await callNotify({
        action: "send",
        familyId: task.family_id,
        taskId: task.id,
        slotKey: `${dateStr}:${slot}`,
        memberId: member.id,
        title: "📋 Une tâche t'attend",
        body: `${member.name}, "${task.title}" n'est pas encore fait!`,
        notifyParent: task.notify_parent,
      });
      notified++;
    });
  }

  await runPool(jobs, CONCURRENCY);

  const ms = Date.now() - started;
  console.log(JSON.stringify({ families: familyIds.length, jobs: jobs.length, notified, ms }));
  return { success: true, notified, families: familyIds.length, ms };
}

Deno.serve(async () => {
  const result = await run(admin);
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
});
