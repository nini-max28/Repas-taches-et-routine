// Ce fichier gère les achats natifs (Apple/Google) via RevenueCat — utilisé
// SEULEMENT quand l'app tourne comme vraie app installée (iOS/Android), jamais
// sur le site web, qui continue d'utiliser Stripe directement.
import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";

// Clé publique RevenueCat — spécifique à la plateforme (iOS a sa propre clé,
// Android aura la sienne une fois ajoutée). Trouvable dans RevenueCat →
// Project Settings → API Keys.
const REVENUECAT_API_KEY_IOS = "appl_VTxilDlwlQBGYJFQvwDYldERTHK";
const REVENUECAT_API_KEY_ANDROID = "VOTRE_CLÉ_PUBLIQUE_ANDROID_ICI";

export const isNativeApp = () => Capacitor.isNativePlatform();

let configured = false;

// À appeler dès qu'on connaît l'id de l'utilisateur Supabase — cet id devient
// aussi l'identifiant RevenueCat, ce qui permet à la fonction serveur
// "revenuecat-webhook" de savoir à quelle famille associer un achat. Appelée
// à nouveau à chaque connexion (pas juste la toute première fois), pour que
// RevenueCat reste toujours aligné sur la bonne personne — sinon un achat
// pourrait rester associé à un ancien identifiant si l'app avait déjà été
// initialisée une première fois avant que la session soit bien établie.
export async function initRevenueCat(userId) {
  if (!isNativeApp() || !userId) return;
  const apiKey = Capacitor.getPlatform() === "ios" ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!configured) {
    await Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
  } else {
    // Déjà configuré (probablement avec un identifiant temporaire/anonyme,
    // ou celui d'une session précédente) — on s'assure que c'est bien CETTE
    // personne qui est identifiée avant tout achat.
    const current = await Purchases.getAppUserID();
    if (current?.appUserID !== userId) await Purchases.logIn({ appUserID: userId });
  }
}

// Retourne les forfaits disponibles (mensuel, annuel) tels que configurés
// dans RevenueCat → Offerings.
export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages || [];
}

export async function purchasePackage(pkg) {
  const result = await Purchases.purchasePackage({ aPackage: pkg });
  return result.customerInfo;
}

export async function restorePurchases() {
  const result = await Purchases.restorePurchases();
  return result.customerInfo;
}

// Un achat vient d'aboutir côté Apple/Google, mais notre base de données ne
// sera mise à jour qu'une fois le webhook RevenueCat reçu (généralement en
// quelques secondes) — cette fonction vérifie l'état actif directement auprès
// de RevenueCat, pour donner un accès immédiat sans attendre le webhook.
export function hasActiveEntitlement(customerInfo, entitlementId = "premium") {
  return !!customerInfo?.entitlements?.active?.[entitlementId];
}
