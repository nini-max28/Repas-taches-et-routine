import React, { createContext, useContext, useState, useEffect } from "react";

// Dictionnaire de traduction — on commence par les écrans les plus visibles
// (accueil, inscription, navigation, actions courantes, réglages). Le contenu
// à l'intérieur de chaque section (formulaires détaillés, recettes suggérées)
// reste en français pour l'instant et sera traduit progressivement.
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
    // Écran de connexion/inscription
    "auth.createAccount": "Créer un compte", "auth.login": "Se connecter", "auth.forgotPassword": "Mot de passe oublié",
    "auth.trialText": "7 jours d'essai gratuit, sans carte de crédit.", "auth.welcomeBack": "Content de vous revoir.",
    "auth.resetText": "Entrez votre courriel pour recevoir un lien de réinitialisation.",
    "auth.email": "Courriel", "auth.password": "Mot de passe", "auth.minChars": "Au moins 6 caractères",
    "auth.forgotLink": "Mot de passe oublié?", "auth.creating": "Un instant…",
    "auth.createBtn": "Créer mon compte", "auth.loginBtn": "Se connecter", "auth.sendLink": "Envoyer le lien",
    "auth.backToLogin": "← Retour à la connexion", "auth.haveAccount": "Déjà un compte? Se connecter",
    "auth.noAccount": "Pas encore de compte? S'inscrire", "auth.back": "← Retour",
    "auth.newPassword": "Nouveau mot de passe", "auth.choosePassword": "Choisissez votre nouveau mot de passe.",
    "auth.changePassword": "Changer le mot de passe", "auth.passwordChanged": "Votre mot de passe a été changé avec succès.",
    "auth.continue": "Continuer",
    // Menu de compte
    "account.title": "Mon compte", "account.manageSubscription": "Gérer mon abonnement", "account.subscribe": "S'abonner",
    "account.active": "Abonnement actif", "account.pastDue": "⚠️ Le dernier paiement a échoué", "account.noSubscription": "Aucun abonnement actif",
    "account.trialEnds": "🕐 Essai gratuit — se termine le",
    "plan.monthly": "mensuel", "plan.annual": "annuel",
    // Titres des cartes de Réglages
    "settings.syncBackend": "Backend de synchronisation", "settings.smsNumbers": "Numéros pour recevoir la liste par SMS",
    "settings.taskAlertChannel": "Canal des alertes de tâches", "settings.deviceNotifications": "Notifications sur l'appareil, par enfant",
    "settings.parentDevice": "Ceci est l'appareil d'un parent", "settings.classHours": "Heures de classe",
    "settings.reminderSchedule": "Horaire des relances", "settings.deviceSync": "Synchronisation de cet appareil",
    "settings.subscription": "Abonnement", "settings.localBackup": "Sauvegarde locale", "settings.taskReminders": "Relances des tâches en alternance",
    // Carte Abonnement (dans Réglages)
    "billing.updatePayment": "Mettre à jour mon moyen de paiement", "billing.trialEnded": "Votre essai est terminé.",
    "billing.subscribeMonthly": "S'abonner — mensuel", "billing.subscribeAnnual": "S'abonner — annuel",
    "billing.paymentFailedLong": "⚠️ Le dernier paiement a échoué — mettez votre carte à jour pour éviter une interruption.",
    // Épicerie
    "grocery.addItem": "Ajouter un article", "grocery.clearChecked": "Effacer les cochés",
    "grocery.resetList": "Réinitialiser la liste", "grocery.sendSms": "Envoyer par SMS", "grocery.sending": "Envoi…",
    "grocery.empty": "Liste vide. Ajoutez un article, ou glissez des ingrédients depuis l'onglet Semaine.",
    // Idées (repas)
    "meals.addMarinades": "Ajouter des marinades", "meals.moreMarinades": "Plus de marinades (poulet, bœuf)",
    "meals.addSnacks": "Ajouter des collations", "meals.addPickyLunches": "Ajouter des lunchs (enfant difficile)",
    "meals.addSideDishes": "Ajouter des accompagnements", "meals.newIdea": "Nouvelle idée",
    "meals.cat.all": "Tous", "meals.cat.dinner": "Soupers", "meals.cat.side": "Accompagnements",
    "meals.cat.lunch": "Lunchs", "meals.cat.snack": "Collations", "meals.cat.marinade": "Marinades", "meals.cat.dessert": "Desserts",
    "meals.allTags": "Toutes étiquettes", "meals.noResults": "Aucune idée pour ces filtres.", "meals.servings": "Pour 6 personnes",
    // Semaine
    "week.weekOf": "Semaine du", "week.noMeal": "Aucun repas", "week.change": "Changer", "week.choose": "Choisir",
    // Tâches
    "tasks.member": "Membre", "tasks.rewardChart": "Défi récompense", "tasks.newTask": "Nouvelle tâche", "tasks.all": "Tous",
    "tasks.addMembersFirst": "Ajoutez d'abord vos enfants comme membres pour pouvoir leur assigner des tâches.",
    "tasks.empty": "Aucune tâche. Ajoutez la première corvée à faire, une routine visuelle, ou un défi récompense.",
    "tasks.sectionRewards": "Défis récompense", "tasks.sectionRoutines": "Routines", "tasks.sectionTasks": "Tâches",
    "tasks.allDone": "Tout est fait 🎉", "tasks.sectionDone": "Fait",
    // Formulaire Membre
    "member.edit": "Modifier le membre", "member.add": "Ajouter un membre", "member.firstName": "Prénom",
    "member.firstNamePlaceholder": "Prénom de l'enfant", "member.phoneOptional": "Numéro de cellulaire (optionnel)",
    "member.phoneHelp": "Si rempli, elle reçoit un texto dès que c'est son tour pour une tâche en alternance.",
    "member.restrictedAccess": "Accès restreint (vue simplifiée)",
    "member.restrictedHelp": "Sur l'appareil de cet enfant, l'app ne montre que ses routines et ses défis récompense en grand — pas les Réglages ni les autres onglets.",
    "member.nameRequired": "Le prénom est requis.",
    // Formulaire Article (épicerie)
    "item.add": "Ajouter un article", "item.name": "Article", "item.namePlaceholder": "Ex. Lait, Pommes, Poulet…",
    "item.quantityOptional": "Quantité (optionnel)", "item.quantityPlaceholder": "Ex. 2 L, 1 sac",
    "item.aisle": "Rayon", "item.nameRequired": "Le nom est requis.",
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
    "auth.createAccount": "Create an account", "auth.login": "Log in", "auth.forgotPassword": "Forgot password",
    "auth.trialText": "7-day free trial, no credit card required.", "auth.welcomeBack": "Welcome back.",
    "auth.resetText": "Enter your email to receive a reset link.",
    "auth.email": "Email", "auth.password": "Password", "auth.minChars": "At least 6 characters",
    "auth.forgotLink": "Forgot password?", "auth.creating": "One moment…",
    "auth.createBtn": "Create my account", "auth.loginBtn": "Log in", "auth.sendLink": "Send link",
    "auth.backToLogin": "← Back to login", "auth.haveAccount": "Already have an account? Log in",
    "auth.noAccount": "No account yet? Sign up", "auth.back": "← Back",
    "auth.newPassword": "New password", "auth.choosePassword": "Choose your new password.",
    "auth.changePassword": "Change password", "auth.passwordChanged": "Your password has been changed successfully.",
    "auth.continue": "Continue",
    "account.title": "My account", "account.manageSubscription": "Manage my subscription", "account.subscribe": "Subscribe",
    "account.active": "Active subscription", "account.pastDue": "⚠️ Last payment failed", "account.noSubscription": "No active subscription",
    "account.trialEnds": "🕐 Free trial — ends on",
    "plan.monthly": "monthly", "plan.annual": "annual",
    "settings.syncBackend": "Sync backend", "settings.smsNumbers": "Numbers to receive the list by SMS",
    "settings.taskAlertChannel": "Task alert channel", "settings.deviceNotifications": "On-device notifications, per child",
    "settings.parentDevice": "This is a parent's device", "settings.classHours": "Class hours",
    "settings.reminderSchedule": "Reminder schedule", "settings.deviceSync": "Sync for this device",
    "settings.subscription": "Subscription", "settings.localBackup": "Local backup", "settings.taskReminders": "Rotating task reminders",
    "billing.updatePayment": "Update my payment method", "billing.trialEnded": "Your trial has ended.",
    "billing.subscribeMonthly": "Subscribe — monthly", "billing.subscribeAnnual": "Subscribe — annual",
    "billing.paymentFailedLong": "⚠️ Last payment failed — update your card to avoid an interruption.",
    "grocery.addItem": "Add an item", "grocery.clearChecked": "Clear checked items",
    "grocery.resetList": "Reset the list", "grocery.sendSms": "Send by SMS", "grocery.sending": "Sending…",
    "grocery.empty": "Empty list. Add an item, or drag ingredients from the Week tab.",
    "meals.addMarinades": "Add marinades", "meals.moreMarinades": "More marinades (chicken, beef)",
    "meals.addSnacks": "Add snacks", "meals.addPickyLunches": "Add lunches (picky eater)",
    "meals.addSideDishes": "Add side dishes", "meals.newIdea": "New idea",
    "meals.cat.all": "All", "meals.cat.dinner": "Dinners", "meals.cat.side": "Side dishes",
    "meals.cat.lunch": "Lunches", "meals.cat.snack": "Snacks", "meals.cat.marinade": "Marinades", "meals.cat.dessert": "Desserts",
    "meals.allTags": "All tags", "meals.noResults": "No ideas for these filters.", "meals.servings": "Serves 6",
    "week.weekOf": "Week of", "week.noMeal": "No meal", "week.change": "Change", "week.choose": "Choose",
    "tasks.member": "Member", "tasks.rewardChart": "Reward chart", "tasks.newTask": "New task", "tasks.all": "All",
    "tasks.addMembersFirst": "First add your children as members so you can assign them tasks.",
    "tasks.empty": "No tasks yet. Add the first chore, a visual routine, or a reward chart.",
    "tasks.sectionRewards": "Reward charts", "tasks.sectionRoutines": "Routines", "tasks.sectionTasks": "Tasks",
    "tasks.allDone": "All done 🎉", "tasks.sectionDone": "Done",
    "member.edit": "Edit member", "member.add": "Add a member", "member.firstName": "First name",
    "member.firstNamePlaceholder": "Child's first name", "member.phoneOptional": "Cell phone number (optional)",
    "member.phoneHelp": "If filled in, they'll get a text as soon as it's their turn for a rotating task.",
    "member.restrictedAccess": "Restricted access (simplified view)",
    "member.restrictedHelp": "On this child's device, the app only shows their routines and reward charts in large view — not Settings or the other tabs.",
    "member.nameRequired": "First name is required.",
    "item.add": "Add an item", "item.name": "Item", "item.namePlaceholder": "E.g. Milk, Apples, Chicken…",
    "item.quantityOptional": "Quantity (optional)", "item.quantityPlaceholder": "E.g. 2 L, 1 bag",
    "item.aisle": "Aisle", "item.nameRequired": "Name is required.",
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
