import React, { createContext, useContext, useState, useEffect } from "react";

// Dictionnaire de traduction — on commence par les écrans les plus visibles
// (accueil, inscription, navigation, actions courantes). Le contenu plus
// spécifique à certaines fonctionnalités reste en français pour l'instant et
// sera traduit progressivement dans de prochaines mises à jour.
const DICTIONARY = {
  fr: {
    // Page d'accueil
    "landing.tagline": "L'épicerie, les repas et les tâches de la famille, sans le casse-tête",
    "landing.subtitle": "Une seule app pour organiser le quotidien de toute la famille — des routines amusantes pour les enfants jusqu'aux corvées qui se partagent toutes seules.",
    "landing.cta": "Commencer mon essai gratuit — 7 jours",
    "landing.noCard": "Aucune carte de crédit requise",
    "landing.login": "Se connecter",
    "landing.install": "📲 Installez Planifamille sur votre écran d'accueil pour une vraie expérience d'application.",
    "landing.installBtn": "Installer",
    "landing.iosHelp": "Sur iPhone/iPad : touchez l'icône Partager ⬆️ dans Safari, puis \"Sur l'écran d'accueil\".",
    "landing.pricingTitle": "Simple, honnête, familial",
    "landing.pricingText": "7 jours d'essai gratuit, puis un abonnement mensuel ou annuel. Annulez en tout temps, directement depuis l'app.",
    "landing.privacy": "Politique de confidentialité",
    "landing.terms": "Conditions d'utilisation",
    "feature.grocery.title": "Épicerie & repas",
    "feature.grocery.text": "Liste d'épicerie partagée, idées de repas et plan de la semaine, sans jamais oublier un ingrédient.",
    "feature.tasks.title": "Tâches en alternance",
    "feature.tasks.text": "Les corvées tournent toutes seules entre les membres de la famille, avec des rappels automatiques.",
    "feature.routines.title": "Routines visuelles pour enfants",
    "feature.routines.text": "Une routine du matin ou du dodo avec de gros pictogrammes tactiles et des célébrations animées.",
    "feature.rewards.title": "Défis récompense",
    "feature.rewards.text": "Un calendrier d'étoiles qui grandit avec l'enfant, avec des paliers cumulatifs à long terme.",
    "feature.notif.title": "Notifications SMS et push",
    "feature.notif.text": "Toute la famille reçoit un rappel au bon moment, sur son propre appareil.",
    // Navigation
    "nav.grocery": "Épicerie", "nav.meals": "Repas", "nav.week": "Semaine",
    "nav.tasks": "Tâches", "nav.settings": "Réglages",
    // Actions courantes
    "action.save": "Enregistrer", "action.cancel": "Annuler", "action.add": "Ajouter",
    "action.delete": "Supprimer", "action.edit": "Modifier", "action.close": "Fermer",
    "action.logout": "Se déconnecter",
    // Réglages / langue
    "settings.language": "Langue", "settings.languageFrench": "Français", "settings.languageEnglish": "Anglais",
  },
  en: {
    "landing.tagline": "Groceries, meals, and family tasks, without the hassle",
    "landing.subtitle": "One app to organize your whole family's daily life — from fun kid-friendly routines to chores that rotate on their own.",
    "landing.cta": "Start my free trial — 7 days",
    "landing.noCard": "No credit card required",
    "landing.login": "Log in",
    "landing.install": "📲 Install Planifamille on your home screen for a true app experience.",
    "landing.installBtn": "Install",
    "landing.iosHelp": "On iPhone/iPad: tap the Share icon ⬆️ in Safari, then \"Add to Home Screen\".",
    "landing.pricingTitle": "Simple, honest, family-friendly",
    "landing.pricingText": "7-day free trial, then a monthly or annual subscription. Cancel anytime, right from the app.",
    "landing.privacy": "Privacy Policy",
    "landing.terms": "Terms of Use",
    "feature.grocery.title": "Groceries & meals",
    "feature.grocery.text": "A shared grocery list, meal ideas, and a weekly plan — never forget an ingredient again.",
    "feature.tasks.title": "Rotating chores",
    "feature.tasks.text": "Chores rotate automatically between family members, with automatic reminders.",
    "feature.routines.title": "Visual routines for kids",
    "feature.routines.text": "A morning or bedtime routine with big, tappable pictures and animated celebrations.",
    "feature.rewards.title": "Reward charts",
    "feature.rewards.text": "A star chart that grows with your child, with cumulative long-term milestones.",
    "feature.notif.title": "SMS and push notifications",
    "feature.notif.text": "Every family member gets a reminder at the right time, on their own device.",
    "nav.grocery": "Groceries", "nav.meals": "Meals", "nav.week": "Week",
    "nav.tasks": "Tasks", "nav.settings": "Settings",
    "action.save": "Save", "action.cancel": "Cancel", "action.add": "Add",
    "action.delete": "Delete", "action.edit": "Edit", "action.close": "Close",
    "action.logout": "Log out",
    "settings.language": "Language", "settings.languageFrench": "French", "settings.languageEnglish": "English",
  },
};

const LanguageContext = createContext({ lang: "fr", setLang: () => {}, t: (k) => k });

function detectDefaultLanguage() {
  try {
    const saved = window.localStorage.getItem("planifamille:lang");
    if (saved === "fr" || saved === "en") return saved;
  } catch { /* ignore */ }
  const nav = (navigator.language || "fr").toLowerCase();
  return nav.startsWith("en") ? "en" : "fr";
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectDefaultLanguage);

  const setLang = (l) => {
    setLangState(l);
    try { window.localStorage.setItem("planifamille:lang", l); } catch { /* ignore */ }
  };

  const t = (key) => DICTIONARY[lang]?.[key] ?? DICTIONARY.fr[key] ?? key;

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
