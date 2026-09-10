import React, { useState, useEffect } from "react";

const COLORS = { paper: "#F5E7DA", card: "#FDF6EE", rule: "#EFD9C7", ink: "#3A2A20", muted: "#8A6F60", accent: "#DD8468", accentDark: "#C97456" };

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const alreadyInstalled = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setInstalled(!!alreadyInstalled);
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream);

    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) return null;

  const install = async () => {
    if (isIOS) { setShowIOSHelp(true); return; }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (!deferredPrompt && !isIOS) return null; // rien à proposer sur ce navigateur

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.rule}`, borderRadius: 12, padding: "14px 18px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13.5 }}>📲 Installez Planifamille sur votre écran d'accueil pour une vraie expérience d'application.</span>
      <button onClick={install} style={{ background: COLORS.accentDark, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
        Installer
      </button>
      {showIOSHelp && (
        <p style={{ width: "100%", fontSize: 12.5, color: COLORS.muted, margin: 0 }}>
          Sur iPhone/iPad : touchez l'icône <strong>Partager</strong> ⬆️ dans Safari, puis <strong>"Sur l'écran d'accueil"</strong>.
        </p>
      )}
    </div>
  );
}

const FEATURES = [
  { emoji: "🛒", title: "Épicerie & repas", text: "Liste d'épicerie partagée, idées de repas et plan de la semaine, sans jamais oublier un ingrédient." },
  { emoji: "✅", title: "Tâches en alternance", text: "Les corvées tournent toutes seules entre les membres de la famille, avec des rappels automatiques." },
  { emoji: "🎈", title: "Routines visuelles pour enfants", text: "Une routine du matin ou du dodo avec de gros pictogrammes tactiles et des célébrations animées." },
  { emoji: "🌟", title: "Défis récompense", text: "Un calendrier d'étoiles qui grandit avec l'enfant, avec des paliers cumulatifs à long terme." },
  { emoji: "📱", title: "Notifications SMS et push", text: "Toute la famille reçoit un rappel au bon moment, sur son propre appareil." },
];

export default function LandingPage({ onStart, onLogin }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.paper, fontFamily: "'IBM Plex Sans', sans-serif", color: COLORS.ink }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 60px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700 }}>Planifamille</span>
          <button onClick={onLogin} style={{ background: "none", border: `1.5px solid ${COLORS.accentDark}`, color: COLORS.accentDark, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Se connecter
          </button>
        </div>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, lineHeight: 1.25, margin: "0 0 16px" }}>
            L'épicerie, les repas et les tâches de la famille, sans le casse-tête
          </h1>
          <p style={{ fontSize: 16, color: COLORS.muted, maxWidth: 480, margin: "0 auto 28px" }}>
            Une seule app pour organiser le quotidien de toute la famille — des routines amusantes pour les enfants jusqu'aux corvées qui se partagent toutes seules.
          </p>
          <button onClick={onStart} style={{
            padding: "15px 32px", borderRadius: 10, border: "none", background: COLORS.accentDark,
            color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer",
          }}>
            Commencer mon essai gratuit — 7 jours
          </button>
          <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 10 }}>Aucune carte de crédit requise</p>
        </div>

        <InstallBanner />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 48 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.rule}` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.emoji}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: COLORS.muted, lineHeight: 1.5 }}>{f.text}</div>
            </div>
          ))}
        </div>

        <div style={{ background: COLORS.card, borderRadius: 14, padding: "24px 28px", border: `1px solid ${COLORS.rule}`, textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Simple, honnête, familial</div>
          <p style={{ fontSize: 14, color: COLORS.muted, maxWidth: 460, margin: "0 auto" }}>
            7 jours d'essai gratuit, puis un abonnement mensuel ou annuel. Annulez en tout temps, directement depuis l'app.
          </p>
        </div>

        <div style={{ textAlign: "center", fontSize: 12.5, color: COLORS.muted }}>
          <a href="/politique-de-confidentialite" style={{ color: COLORS.muted, marginRight: 16 }}>Politique de confidentialité</a>
          <a href="/conditions-utilisation" style={{ color: COLORS.muted }}>Conditions d'utilisation</a>
        </div>
      </div>
    </div>
  );
}
