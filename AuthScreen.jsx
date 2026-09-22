import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { useLanguage } from "./i18n.jsx";

const COLORS = { paper: "#F5E7DA", card: "#FDF6EE", rule: "#EFD9C7", ink: "#3A2A20", muted: "#8A6F60", accent: "#DD8468", accentDark: "#C97456", danger: "#B5715F" };

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
export default function AuthScreen({ onAuthed, initialMode = "signup", onBack }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState(initialMode); // "signup" | "login" | "reset"
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
      } else if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
        });
        if (resetError) throw resetError;
        setMessage("Si un compte existe avec ce courriel, un lien pour choisir un nouveau mot de passe vient d'être envoyé.");
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
        {onBack && (
          <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}>
            {t("auth.back")}
          </button>
        )}
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 4 }}>
          {mode === "signup" ? t("auth.createAccount") : mode === "reset" ? t("auth.forgotPassword") : t("auth.login")}
        </h1>
        <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 0, marginBottom: 22 }}>
          {mode === "signup" ? t("auth.trialText") : mode === "reset" ? t("auth.resetText") : t("auth.welcomeBack")}
        </p>

        <form onSubmit={submit}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.ink, display: "block", marginBottom: 6 }}>{t("auth.email")}</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="vous@exemple.com" />

          {mode !== "reset" && (
            <>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.ink, display: "block", marginBottom: 6 }}>{t("auth.password")}</label>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder={t("auth.minChars")} />
            </>
          )}

          {mode === "login" && (
            <button type="button" onClick={() => { setMode("reset"); setError(""); setMessage(""); }} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 12.5, cursor: "pointer", padding: 0, display: "block", marginTop: -6, marginBottom: 14, textDecoration: "underline" }}>
              {t("auth.forgotLink")}
            </button>
          )}

          {error && <p style={{ color: COLORS.danger, fontSize: 13, marginTop: -6, marginBottom: 14 }}>{error}</p>}
          {message && <p style={{ color: COLORS.accentDark, fontSize: 13, marginTop: -6, marginBottom: 14 }}>{message}</p>}

          <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>
            {busy ? t("auth.creating") : mode === "signup" ? t("auth.createBtn") : mode === "reset" ? t("auth.sendLink") : t("auth.loginBtn")}
          </button>
        </form>

        {mode === "reset" ? (
          <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} style={{
            background: "none", border: "none", color: COLORS.accentDark, fontSize: 13, marginTop: 16, cursor: "pointer", width: "100%", textAlign: "center",
          }}>
            {t("auth.backToLogin")}
          </button>
        ) : (
          <button onClick={() => { setMode(m => m === "signup" ? "login" : "signup"); setError(""); setMessage(""); }} style={{
            background: "none", border: "none", color: COLORS.accentDark, fontSize: 13, marginTop: 16, cursor: "pointer", width: "100%", textAlign: "center",
          }}>
            {mode === "signup" ? t("auth.haveAccount") : t("auth.noAccount")}
          </button>
        )}
      </div>
    </div>
  );
}

// Écran affiché une fois que la personne a cliqué le lien reçu par courriel —
// Supabase l'a déjà connectée temporairement à ce moment-là, il ne reste qu'à
// choisir un nouveau mot de passe.
export function ResetPasswordConfirm({ onDone }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError(traduireErreur(err.message));
    }
    setBusy(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380, background: COLORS.card, borderRadius: 16, padding: 28, border: `1px solid ${COLORS.rule}` }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 4 }}>{t("auth.newPassword")}</h1>
        {done ? (
          <>
            <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 20 }}>{t("auth.passwordChanged")}</p>
            <button onClick={onDone} style={primaryBtn}>{t("auth.continue")}</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 0, marginBottom: 22 }}>{t("auth.choosePassword")}</p>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.ink, display: "block", marginBottom: 6 }}>{t("auth.newPassword")}</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder={t("auth.minChars")} />
            {error && <p style={{ color: COLORS.danger, fontSize: 13, marginTop: -6, marginBottom: 14 }}>{error}</p>}
            <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>{busy ? t("auth.creating") : t("auth.changePassword")}</button>
          </form>
        )}
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
