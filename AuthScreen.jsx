import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const COLORS = { paper: "#EAE2CB", card: "#F7F3E3", rule: "#D8D2BE", ink: "#22201A", muted: "#7A7256", accent: "#B8863A", accentDark: "#8A6423", danger: "#B5715F" };

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${COLORS.rule}`,
  fontSize: 15, marginBottom: 14, boxSizing: "border-box", fontFamily: "'IBM Plex Sans', sans-serif",
};
const primaryBtn = {
  width: "100%", padding: "13px 16px", borderRadius: 8, border: "none", background: COLORS.accentDark,
  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
};

// Écran d'inscription/connexion — c'est la porte d'entrée du produit commercial.
// Tant que la personne n'est pas connectée, elle ne voit jamais l'app elle-même.
export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.session) {
          onAuthed(data.session);
        } else {
          setMessage("Vérifiez votre courriel pour confirmer votre compte, puis revenez vous connecter.");
        }
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        onAuthed(data.session);
      }
    } catch (err) {
      setError(traduireErreur(err.message));
    }
    setBusy(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380, background: COLORS.card, borderRadius: 16, padding: 28, border: `1px solid ${COLORS.rule}` }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 4 }}>
          {mode === "signup" ? "Créer un compte" : "Se connecter"}
        </h1>
        <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 0, marginBottom: 22 }}>
          {mode === "signup" ? "14 jours d'essai gratuit, sans carte de crédit." : "Content de vous revoir."}
        </p>

        <form onSubmit={submit}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.ink, display: "block", marginBottom: 6 }}>Courriel</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="vous@exemple.com" />

          <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.ink, display: "block", marginBottom: 6 }}>Mot de passe</label>
          <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Au moins 6 caractères" />

          {error && <p style={{ color: COLORS.danger, fontSize: 13, marginTop: -6, marginBottom: 14 }}>{error}</p>}
          {message && <p style={{ color: COLORS.accentDark, fontSize: 13, marginTop: -6, marginBottom: 14 }}>{message}</p>}

          <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>
            {busy ? "Un instant…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>

        <button onClick={() => { setMode(m => m === "signup" ? "login" : "signup"); setError(""); setMessage(""); }} style={{
          background: "none", border: "none", color: COLORS.accentDark, fontSize: 13, marginTop: 16, cursor: "pointer", width: "100%", textAlign: "center",
        }}>
          {mode === "signup" ? "Déjà un compte? Se connecter" : "Pas encore de compte? S'inscrire"}
        </button>
      </div>
    </div>
  );
}

function traduireErreur(msg) {
  if (!msg) return "Une erreur est survenue.";
  if (msg.includes("already registered") || msg.includes("already exists")) return "Ce courriel a déjà un compte — essayez de vous connecter.";
  if (msg.includes("Invalid login credentials")) return "Courriel ou mot de passe incorrect.";
  if (msg.includes("Password should be at least")) return "Le mot de passe doit avoir au moins 6 caractères.";
  if (msg.includes("Email not confirmed")) return "Confirmez votre courriel avant de vous connecter (vérifiez vos courriels).";
  return msg;
}
