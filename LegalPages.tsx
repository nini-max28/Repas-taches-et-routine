import React from "react";

const COLORS = { paper: "#F5E7DA", card: "#FDF6EE", rule: "#EFD9C7", ink: "#3A2A20", muted: "#8A6F60", accentDark: "#C97456" };

const wrap = { minHeight: "100vh", background: COLORS.paper, fontFamily: "'IBM Plex Sans', sans-serif", color: COLORS.ink };
const inner = { maxWidth: 680, margin: "0 auto", padding: "40px 20px 80px" };
const h1 = { fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, marginBottom: 4 };
const h2 = { fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, marginTop: 32, marginBottom: 10 };
const p = { fontSize: 14.5, lineHeight: 1.7, color: COLORS.ink, marginBottom: 14 };
const muted = { fontSize: 13, color: COLORS.muted };
const backLink = { color: COLORS.accentDark, fontSize: 13.5, textDecoration: "none", fontWeight: 600 };

function Layout({ title, children }) {
  return (
    <div style={wrap}>
      <div style={inner}>
        <a href="/" style={backLink}>← Retour à Planifamille</a>
        <h1 style={{ ...h1, marginTop: 18 }}>{title}</h1>
        <p style={muted}>Planifamille — Dernière mise à jour : 9 septembre 2026</p>
        <div style={{ marginTop: 24 }}>{children}</div>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <Layout title="Politique de confidentialité">
      <p style={p}>Planifamille, exploitée par Stéphanie Doucet, est responsable de la collecte et de la protection des renseignements personnels recueillis par l'application.</p>

      <h2 style={h2}>Responsable de la protection des renseignements personnels</h2>
      <p style={p}>Stéphanie Doucet, responsable de la protection des renseignements personnels.<br />Courriel : info@planifamille.ca</p>

      <h2 style={h2}>Quels renseignements nous recueillons</h2>
      <p style={p}>
        Renseignements de compte (courriel, mot de passe chiffré) ; renseignements familiaux que vous choisissez d'ajouter (prénoms des membres de la famille, y compris les enfants, couleurs et avatars) ;
        numéros de téléphone pour les alertes SMS que vous activez ; le contenu que vous créez (listes d'épicerie, idées de repas, tâches, routines, défis récompense) ;
        renseignements de paiement, traités entièrement par Stripe — nous ne voyons ni ne stockons jamais votre numéro de carte ; données techniques (adresse IP, type d'appareil, journaux d'erreurs).
      </p>
      <p style={p}>
        Notre service est conçu pour être utilisé par des parents qui créent des profils pour leurs enfants. Les enfants ne créent pas de compte et ne fournissent aucun renseignement directement — c'est le parent titulaire du compte qui saisit et contrôle ces informations en tout temps.
      </p>

      <h2 style={h2}>Comment nous utilisons ces renseignements</h2>
      <p style={p}>Uniquement pour faire fonctionner l'application, traiter vos paiements d'abonnement, vous contacter au sujet de votre compte, améliorer le service et respecter nos obligations légales. Nous ne vendons jamais vos renseignements personnels, ni ceux de vos enfants, à des tiers à des fins publicitaires ou commerciales.</p>

      <h2 style={h2}>Avec qui nous partageons des renseignements</h2>
      <p style={p}>Nous faisons appel à des fournisseurs externes, chacun n'ayant accès qu'aux renseignements nécessaires à sa tâche : Supabase (hébergement de la base de données), Twilio (envoi des messages texte), Stripe (traitement des paiements), Render (hébergement du site web). Certains de ces fournisseurs peuvent stocker des données à l'extérieur du Québec.</p>

      <h2 style={h2}>Combien de temps nous conservons vos renseignements</h2>
      <p style={p}>Vos données sont conservées tant que votre compte est actif. Si vous annulez votre abonnement, vos données restent disponibles pendant 60 jours, puis sont supprimées définitivement, sauf obligation légale de conservation plus longue. Vous pouvez demander la suppression immédiate de votre compte en tout temps.</p>

      <h2 style={h2}>Comment nous protégeons vos renseignements</h2>
      <p style={p}>Chiffrement des mots de passe, séparation stricte des données entre chaque famille abonnée, accès limité au personnel qui en a besoin, surveillance des accès à la base de données.</p>

      <h2 style={h2}>Vos droits</h2>
      <p style={p}>Vous pouvez en tout temps consulter, corriger ou demander la suppression de vos renseignements, ou en demander une copie transférable, en écrivant à info@planifamille.ca. Nous répondrons dans un délai de 30 jours. Vous pouvez aussi déposer une plainte auprès de la Commission d'accès à l'information du Québec.</p>

      <h2 style={h2}>Incidents de confidentialité</h2>
      <p style={p}>En cas d'incident présentant un risque de préjudice sérieux, nous en informerons la Commission d'accès à l'information du Québec et les personnes concernées, conformément à nos obligations légales.</p>

      <h2 style={h2}>Modifications de cette politique</h2>
      <p style={p}>Nous pouvons mettre à jour cette politique. Toute modification importante vous sera communiquée par courriel ou par un avis dans l'application avant son entrée en vigueur.</p>

      <h2 style={h2}>Nous joindre</h2>
      <p style={p}>info@planifamille.ca</p>
    </Layout>
  );
}

export function TermsPage() {
  return (
    <Layout title="Conditions d'utilisation">
      <p style={p}>En créant un compte sur Planifamille, vous acceptez les présentes conditions ainsi que notre <a href="/politique-de-confidentialite" style={{ color: COLORS.accentDark }}>politique de confidentialité</a>. Vous devez avoir 18 ans ou plus pour créer un compte. Le service permet de créer des profils pour des enfants, mais ce sont toujours les parents/tuteurs, titulaires du compte, qui en assument la responsabilité.</p>

      <h2 style={h2}>Description du service</h2>
      <p style={p}>Planifamille est une application web permettant aux familles de gérer leur épicerie, leurs repas, leurs tâches ménagères et leurs routines, avec des notifications par SMS et par notification push.</p>

      <h2 style={h2}>Essai gratuit et abonnement</h2>
      <p style={p}>Un essai gratuit de 7 jours est offert à la création du compte, sans obligation d'entrer une carte de crédit. À la fin de l'essai, un abonnement payant (mensuel ou annuel) est requis pour continuer. L'abonnement se renouvelle automatiquement à la fin de chaque période, jusqu'à annulation.</p>

      <h2 style={h2}>Annulation et remboursement</h2>
      <p style={p}>Vous pouvez annuler votre abonnement en tout temps depuis la section "Abonnement" de l'application. L'annulation prend effet à la fin de la période déjà payée.</p>

      <h2 style={h2}>Vos responsabilités</h2>
      <p style={p}>Vous acceptez de fournir des renseignements exacts, de garder votre mot de passe confidentiel, d'utiliser le service à des fins personnelles et familiales légitimes, et de ne pas tenter d'accéder aux données d'une autre famille.</p>

      <h2 style={h2}>Propriété du contenu</h2>
      <p style={p}>Vous conservez tous les droits sur le contenu que vous créez dans l'application. Nous ne l'utilisons que pour vous fournir le service.</p>

      <h2 style={h2}>Disponibilité du service</h2>
      <p style={p}>Nous faisons de notre mieux pour maintenir le service disponible, sans garantir un fonctionnement ininterrompu ou sans erreur.</p>

      <h2 style={h2}>Limitation de responsabilité</h2>
      <p style={p}>Dans la mesure permise par la loi, Planifamille ne pourra être tenue responsable de dommages indirects, accessoires ou consécutifs liés à l'utilisation du service, sous réserve des garanties qui ne peuvent être exclues par la loi québécoise applicable.</p>

      <h2 style={h2}>Droit applicable</h2>
      <p style={p}>Ces conditions sont régies par les lois de la province de Québec et les lois fédérales du Canada applicables.</p>

      <h2 style={h2}>Nous joindre</h2>
      <p style={p}>info@planifamille.ca</p>
    </Layout>
  );
}
