import React, { useState, useEffect } from "react";
import { useLanguage } from "./i18n.jsx";

const COLORS = { paper: "#F5E7DA", card: "#FDF6EE", rule: "#EFD9C7", ink: "#3A2A20", muted: "#8A6F60", accent: "#DD8468", accentDark: "#C97456" };

function InstallBanner() {
  const { t } = useLanguage();
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
      <span style={{ fontSize: 13.5 }}>{t("landing.install")}</span>
      <button onClick={install} style={{ background: COLORS.accentDark, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
        {t("landing.installBtn")}
      </button>
      {showIOSHelp && (
        <p style={{ width: "100%", fontSize: 12.5, color: COLORS.muted, margin: 0 }}>
          {t("landing.iosHelp")}
        </p>
      )}
    </div>
  );
}

export default function LandingPage({ onStart, onLogin }) {
  const { t, lang, setLang } = useLanguage();

  const FEATURES = [
    { emoji: "🛒", title: t("feature.grocery.title"), text: t("feature.grocery.text") },
    { emoji: "✅", title: t("feature.tasks.title"), text: t("feature.tasks.text") },
    { emoji: "🎈", title: t("feature.routines.title"), text: t("feature.routines.text") },
    { emoji: "🌟", title: t("feature.rewards.title"), text: t("feature.rewards.text") },
    { emoji: "📱", title: t("feature.notif.title"), text: t("feature.notif.text") },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paper, fontFamily: "'IBM Plex Sans', sans-serif", color: COLORS.ink }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 20px 60px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700 }}>Planifamille</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", border: `1.5px solid ${COLORS.rule}`, borderRadius: 8, overflow: "hidden" }}>
              <button onClick={() => setLang("fr")} style={{ padding: "6px 10px", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, background: lang === "fr" ? COLORS.accentDark : "transparent", color: lang === "fr" ? "#fff" : COLORS.muted }}>FR</button>
              <button onClick={() => setLang("en")} style={{ padding: "6px 10px", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, background: lang === "en" ? COLORS.accentDark : "transparent", color: lang === "en" ? "#fff" : COLORS.muted }}>EN</button>
            </div>
            <button onClick={onLogin} style={{ background: "none", border: `1.5px solid ${COLORS.accentDark}`, color: COLORS.accentDark, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              {t("landing.login")}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, lineHeight: 1.25, margin: "0 0 16px" }}>
            {t("landing.tagline")}
          </h1>
          <p style={{ fontSize: 16, color: COLORS.muted, maxWidth: 480, margin: "0 auto 28px" }}>
            {t("landing.subtitle")}
          </p>
          <button onClick={onStart} style={{
            padding: "15px 32px", borderRadius: 10, border: "none", background: COLORS.accentDark,
            color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer",
          }}>
            {t("landing.cta")}
          </button>
          <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 10 }}>{t("landing.noCard")}</p>
        </div>

        <InstallBanner />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 48 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.rule}` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.emoji}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: COLORS.muted, lineHeight: 1.5 }}>{f.text}</div>
            </div>
          ))}
        </div>

        <div style={{ background: COLORS.card, borderRadius: 14, padding: "24px 28px", border: `1px solid ${COLORS.rule}`, textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{t("landing.pricingTitle")}</div>
          <p style={{ fontSize: 14, color: COLORS.muted, maxWidth: 460, margin: "0 auto" }}>
            {t("landing.pricingText")}
          </p>
        </div>

        <div style={{ textAlign: "center", fontSize: 12.5, color: COLORS.muted }}>
          <a href="/politique-de-confidentialite" style={{ color: COLORS.muted, marginRight: 16 }}>{t("landing.privacy")}</a>
          <a href="/conditions-utilisation" style={{ color: COLORS.muted }}>{t("landing.terms")}</a>
        </div>
      </div>
    </div>
  );
}
