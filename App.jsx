import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "./supabaseClient";
import AuthScreen from "./AuthScreen";
import {
  ShoppingCart, ChefHat, CalendarDays, Settings, Plus, X, Check, Trash2, Pencil,
  RefreshCw, AlertCircle, Dice5, ChevronLeft, ChevronRight, Sparkles, ListTodo, UserPlus, Send, Bell,
  Camera, FileText
} from "lucide-react";

const LS_PREFIX = "epicerieRepas:";
const DEFAULT_SETTINGS = { phone1: "", phone2: "", phone3: "", phone4: "", schoolHoursEnabled: true, schoolStartHour: 8, schoolEndHour: 15, taskNotifyChannel: "both" };

const AISLES = [
  { id: "fruits-legumes", name: "Fruits & légumes", color: "#6B9B5E" },
  { id: "viandes", name: "Viandes & poissons", color: "#A6634A" },
  { id: "laitiers", name: "Produits laitiers", color: "#6B8CA8" },
  { id: "epicerie", name: "Épicerie / sec", color: "#C79A3E" },
  { id: "surgeles", name: "Surgelés", color: "#4E8C97" },
  { id: "autres", name: "Autres", color: "#8A8264" },
];

const AISLE_KEYWORDS = [
  { aisle: "viandes", words: ["boeuf", "poulet", "porc", "saumon", "poisson", "crevette", "won-ton", "veau", "jambon", "bacon"] },
  { aisle: "fruits-legumes", words: ["oignon", "ail", "poivron", "tomate", "laitue", "brocoli", "patate", "pomme de terre", "citron", "gingembre", "carotte", "pomme", "menthe", "fruits", "bok choy", "avoine"] },
  { aisle: "laitiers", words: ["fromage", "lait", "crème", "beurre", "oeuf", "parmesan", "cheddar", "mozzarella"] },
  { aisle: "epicerie", words: ["riz", "pâtes", "farine", "chapelure", "sauce", "bouillon", "épices", "cassonade", "sucre", "sirop", "cari", "tortillas", "pain", "vanille", "cannelle", "haricots", "pois chiches", "sauce tomate", "maïs en crème", "lait de coco"] },
];
function guessAisle(name) {
  const n = name.toLowerCase();
  for (const g of AISLE_KEYWORDS) if (g.words.some(w => n.includes(w))) return g.aisle;
  return "autres";
}

// Marinades faciles — proposées via un bouton "Ajouter des marinades" dans
// l'onglet Idées plutôt qu'intégrées d'office, pour ne pas dupliquer ou déranger
// une liste déjà en place sur un appareil qui a déjà ses propres idées.
const MARINADE_RECIPES = [
  { title: "Marinade soya-érable", category: "marinade", tags: ["poulet", "porc", "rapide"],
    ingredients: [{ name: "sauce soya", quantity: "80 ml" }, { name: "sirop d'érable", quantity: "60 ml" }, { name: "ail", quantity: "2 gousses" }, { name: "gingembre", quantity: "1 c. à thé" }, { name: "huile végétale", quantity: "2 c. à soupe" }],
    steps: ["Mélanger tous les ingrédients dans un bol ou un sac hermétique.", "Ajouter la viande et bien enrober.", "Laisser mariner au réfrigérateur 30 min à quelques heures.", "Cuire à la poêle, au four ou au BBQ selon la viande."] },
  { title: "Marinade citron, ail et herbes", category: "marinade", tags: ["poisson", "poulet", "rapide"],
    ingredients: [{ name: "jus de citron", quantity: "60 ml" }, { name: "ail", quantity: "2 gousses" }, { name: "huile d'olive", quantity: "60 ml" }, { name: "herbes de Provence", quantity: "1 c. à soupe" }, { name: "sel", quantity: "1/2 c. à thé" }, { name: "poivre", quantity: "1/4 c. à thé" }],
    steps: ["Mélanger tous les ingrédients dans un bol ou un sac hermétique.", "Ajouter la viande ou le poisson et bien enrober.", "Laisser mariner 20-30 min (moins longtemps pour le poisson).", "Cuire à la poêle, au four ou au BBQ."] },
  { title: "Marinade BBQ maison", category: "marinade", tags: ["poulet", "porc", "boeuf"],
    ingredients: [{ name: "ketchup", quantity: "125 ml" }, { name: "cassonade", quantity: "2 c. à soupe" }, { name: "vinaigre", quantity: "2 c. à soupe" }, { name: "paprika fumé", quantity: "1 c. à thé" }, { name: "moutarde", quantity: "1 c. à soupe" }],
    steps: ["Mélanger tous les ingrédients dans un bol ou un sac hermétique.", "Ajouter la viande et bien enrober.", "Laisser mariner au moins 1 h, idéalement toute une nuit.", "Cuire au BBQ ou au four."] },
  { title: "Marinade teriyaki maison", category: "marinade", tags: ["poulet", "boeuf", "saumon"],
    ingredients: [{ name: "sauce soya", quantity: "80 ml" }, { name: "sirop d'érable", quantity: "60 ml" }, { name: "gingembre", quantity: "1 c. à thé" }, { name: "ail", quantity: "2 gousses" }, { name: "huile de sésame", quantity: "1 c. à soupe" }],
    steps: ["Mélanger tous les ingrédients dans un bol ou un sac hermétique.", "Ajouter la viande ou le poisson et bien enrober.", "Laisser mariner 30 min à quelques heures.", "Cuire à la poêle ou au BBQ."] },
  { title: "Marinade yogourt et épices (façon tandoori)", category: "marinade", tags: ["poulet"],
    ingredients: [{ name: "yogourt nature", quantity: "250 ml" }, { name: "poudre de cari", quantity: "1 c. à soupe" }, { name: "cumin", quantity: "1 c. à thé" }, { name: "paprika", quantity: "1 c. à thé" }, { name: "ail", quantity: "2 gousses" }, { name: "jus de citron", quantity: "1 c. à soupe" }],
    steps: ["Mélanger tous les ingrédients dans un bol.", "Ajouter le poulet et bien enrober.", "Laisser mariner au moins 1 h, idéalement toute une nuit.", "Cuire au four ou au BBQ."] },
  { title: "Marinade moutarde et miel", category: "marinade", tags: ["porc", "poulet", "rapide"],
    ingredients: [{ name: "moutarde de Dijon", quantity: "2 c. à soupe" }, { name: "miel", quantity: "2 c. à soupe" }, { name: "huile végétale", quantity: "2 c. à soupe" }, { name: "vinaigre", quantity: "1 c. à soupe" }, { name: "ail", quantity: "1 gousse" }],
    steps: ["Mélanger tous les ingrédients dans un bol ou un sac hermétique.", "Ajouter la viande et bien enrober.", "Laisser mariner 30 min à quelques heures.", "Cuire à la poêle, au four ou au BBQ."] },
  { title: "Marinade italienne", category: "marinade", tags: ["boeuf", "poulet", "légumes"],
    ingredients: [{ name: "huile d'olive", quantity: "80 ml" }, { name: "vinaigre balsamique", quantity: "2 c. à soupe" }, { name: "ail", quantity: "2 gousses" }, { name: "herbes italiennes", quantity: "1 c. à soupe" }, { name: "moutarde", quantity: "1 c. à thé" }],
    steps: ["Mélanger tous les ingrédients dans un bol ou un sac hermétique.", "Ajouter la viande ou les légumes et bien enrober.", "Laisser mariner 30 min à quelques heures.", "Cuire à la poêle, au four ou au BBQ."] },
  { title: "Marinade épicée façon cajun", category: "marinade", tags: ["poulet", "crevettes"],
    ingredients: [{ name: "huile végétale", quantity: "2 c. à soupe" }, { name: "paprika", quantity: "1 c. à soupe" }, { name: "poudre d'ail", quantity: "1 c. à thé" }, { name: "poudre d'oignon", quantity: "1 c. à thé" }, { name: "origan", quantity: "1 c. à thé" }, { name: "poivre de cayenne", quantity: "1/4 c. à thé" }, { name: "jus de citron", quantity: "1 c. à soupe" }],
    steps: ["Mélanger tous les ingrédients dans un bol ou un sac hermétique.", "Ajouter la viande et bien enrober.", "Laisser mariner 20-30 min.", "Cuire à la poêle ou au BBQ à feu assez vif."] },
];

// Collations pour la boîte à lunch — sans arachides ni noix par défaut, puisque
// beaucoup d'écoles l'interdisent; une alternative (beurre de soya/graines) est
// suggérée où le beurre d'arachide serait normalement utilisé.
const SNACK_RECIPES = [
  { title: "Fromage en ficelle et craquelins", category: "collation", tags: ["sans arachides", "sans prep"],
    ingredients: [{ name: "fromage en ficelle", quantity: "1" }, { name: "craquelins", quantity: "6-8" }],
    steps: ["Emballer directement, aucune préparation nécessaire."] },
  { title: "Pomme tranchée et beurre de soya", category: "collation", tags: ["sans arachides"],
    ingredients: [{ name: "pomme", quantity: "1" }, { name: "beurre de soya ou de graines de tournesol", quantity: "2 c. à soupe" }],
    steps: ["Trancher la pomme (un filet de jus de citron l'empêche de brunir).", "Emballer avec le beurre de soya à part pour tremper."] },
  { title: "Yogourt à boire", category: "collation", tags: ["sans arachides", "sans prep"],
    ingredients: [{ name: "yogourt à boire", quantity: "1 portion" }],
    steps: ["Emballer directement, aucune préparation nécessaire."] },
  { title: "Mini muffins maison à la banane", category: "collation", tags: ["sans arachides", "four"],
    ingredients: [{ name: "banane", quantity: "3 mûres" }, { name: "farine", quantity: "375 ml" }, { name: "oeuf", quantity: "1" }, { name: "huile végétale", quantity: "80 ml" }, { name: "cassonade", quantity: "125 ml" }, { name: "poudre à pâte", quantity: "1 c. à thé" }],
    steps: ["Préchauffer le four à 350°F (175°C).", "Écraser les bananes, mélanger avec l'oeuf, l'huile et la cassonade.", "Incorporer la farine et la poudre à pâte.", "Verser dans des moules à mini muffins, cuire 12-15 min.", "Laisser refroidir avant d'emballer."] },
  { title: "Bâtonnets de légumes et houmous", category: "collation", tags: ["sans arachides"],
    ingredients: [{ name: "carotte", quantity: "1" }, { name: "concombre", quantity: "1/2" }, { name: "houmous", quantity: "60 ml" }],
    steps: ["Couper les légumes en bâtonnets.", "Emballer avec le houmous dans un petit contenant à part."] },
  { title: "Mélange maison sans noix", category: "collation", tags: ["sans arachides", "sans prep"],
    ingredients: [{ name: "céréales de riz soufflé ou Cheerios", quantity: "250 ml" }, { name: "raisins secs", quantity: "80 ml" }, { name: "petits morceaux de fromage", quantity: "80 ml" }],
    steps: ["Mélanger les ingrédients dans un petit contenant réutilisable."] },
  { title: "Compote de pommes en portion individuelle", category: "collation", tags: ["sans arachides", "sans prep"],
    ingredients: [{ name: "compote de pommes en portion individuelle", quantity: "1" }],
    steps: ["Emballer directement, aucune préparation nécessaire."] },
  { title: "Oeuf cuit dur", category: "collation", tags: ["sans arachides"],
    ingredients: [{ name: "oeuf", quantity: "1-2" }],
    steps: ["Cuire l'oeuf dur à l'avance (10 min dans l'eau bouillante), refroidir et écaler.", "Peut se préparer plusieurs jours d'avance et se garder au frigo."] },
  { title: "Barres tendres maison sans noix", category: "collation", tags: ["sans arachides", "four"],
    ingredients: [{ name: "flocons d'avoine", quantity: "500 ml" }, { name: "beurre", quantity: "125 ml" }, { name: "miel ou sirop d'érable", quantity: "125 ml" }, { name: "cassonade", quantity: "60 ml" }],
    steps: ["Préchauffer le four à 350°F (175°C).", "Faire fondre le beurre avec le miel et la cassonade.", "Mélanger avec l'avoine, presser dans un moule carré tapissé.", "Cuire 15-18 min, laisser refroidir complètement avant de couper."] },
  { title: "Raisins et cubes de fromage", category: "collation", tags: ["sans arachides", "sans prep"],
    ingredients: [{ name: "raisins", quantity: "125 ml" }, { name: "fromage", quantity: "6-8 cubes" }],
    steps: ["Emballer directement, aucune préparation nécessaire."] },
];

// Idées de lunch pour enfants difficiles — aliments simples et familiers, souvent
// séparés plutôt que mélangés (beaucoup d'enfants difficiles préfèrent que rien ne
// se touche dans la boîte à lunch).
const PICKY_LUNCH_RECIPES = [
  { title: "Pâtes froides au beurre et parmesan", category: "lunch", tags: ["difficile", "rapide"],
    ingredients: [{ name: "pâtes courtes (macaroni, fusilli)", quantity: "250 ml cuites" }, { name: "beurre", quantity: "1 c. à soupe" }, { name: "parmesan", quantity: "2 c. à soupe" }],
    steps: ["Cuire les pâtes, égoutter et mélanger avec le beurre et le parmesan.", "Laisser refroidir avant d'emballer (se mange froid ou tiède)."] },
  { title: "Roulés de jambon et fromage", category: "lunch", tags: ["difficile", "sans prep"],
    ingredients: [{ name: "tranches de jambon", quantity: "2-3" }, { name: "fromage en tranches", quantity: "2" }],
    steps: ["Rouler une tranche de fromage dans chaque tranche de jambon.", "Emballer tel quel, sans pain."] },
  { title: "Assiette-lunch à compartiments", category: "lunch", tags: ["difficile", "sans prep"],
    ingredients: [{ name: "craquelins", quantity: "6-8" }, { name: "fromage en cubes", quantity: "60 ml" }, { name: "raisins ou fruit préféré", quantity: "125 ml" }, { name: "petite protéine (jambon, poulet froid)", quantity: "60 ml" }],
    steps: ["Séparer chaque aliment dans son propre compartiment d'une boîte à lunch style bento.", "Rien ne se touche — souvent plus apprécié par un enfant difficile."] },
  { title: "Quesadilla simple au fromage", category: "lunch", tags: ["difficile", "rapide"],
    ingredients: [{ name: "tortilla", quantity: "1" }, { name: "fromage râpé", quantity: "60 ml" }],
    steps: ["Garnir la moitié d'une tortilla de fromage râpé, plier.", "Cuire à la poêle 1-2 min de chaque côté jusqu'à ce que le fromage fonde.", "Laisser refroidir, couper en pointes avant d'emballer."] },
  { title: "Nouilles beurre et sauce soya", category: "lunch", tags: ["difficile", "asiatique"],
    ingredients: [{ name: "nouilles ou spaghettis", quantity: "250 ml cuites" }, { name: "beurre", quantity: "1 c. à soupe" }, { name: "sauce soya", quantity: "1 c. à thé" }],
    steps: ["Cuire les nouilles, égoutter.", "Mélanger avec le beurre et la sauce soya.", "Laisser refroidir avant d'emballer."] },
  { title: "Bouchées de poulet froides et ketchup à part", category: "lunch", tags: ["difficile"],
    ingredients: [{ name: "bouchées de poulet pané (maison ou du commerce)", quantity: "5-6" }, { name: "ketchup", quantity: "1 petit contenant" }],
    steps: ["Cuire les bouchées de poulet à l'avance selon les instructions, laisser refroidir.", "Emballer avec le ketchup dans un petit contenant séparé pour tremper."] },
  { title: "Riz blanc et poulet nature", category: "lunch", tags: ["difficile"],
    ingredients: [{ name: "riz blanc", quantity: "250 ml cuit" }, { name: "poulet cuit nature, en cubes", quantity: "125 ml" }],
    steps: ["Cuire le riz et le poulet séparément, sans sauce ni épices.", "Laisser refroidir, emballer dans des compartiments séparés."] },
  { title: "Sandwich jambon nature", category: "lunch", tags: ["difficile", "sans prep"],
    ingredients: [{ name: "pain", quantity: "2 tranches" }, { name: "jambon", quantity: "2-3 tranches" }, { name: "fromage (optionnel)", quantity: "1 tranche" }],
    steps: ["Assembler le sandwich avec seulement le jambon (et le fromage si désiré), sans autre garniture.", "Couper en pointes ou en bâtonnets selon la préférence de l'enfant."] },
];

// Accompagnements faciles pour compléter un souper.
const SIDE_DISH_RECIPES = [
  { title: "Riz pilaf simple", category: "accompagnement", tags: ["rapide"],
    ingredients: [{ name: "riz", quantity: "375 ml" }, { name: "bouillon de poulet ou légumes", quantity: "500 ml" }, { name: "oignon haché", quantity: "1/4" }, { name: "beurre", quantity: "1 c. à soupe" }],
    steps: ["Faire revenir l'oignon dans le beurre 2 min.", "Ajouter le riz, remuer 1 min.", "Verser le bouillon, porter à ébullition puis couvrir et réduire à feu doux.", "Cuire 18 min, laisser reposer 5 min avant de servir."] },
  { title: "Purée de pommes de terre maison", category: "accompagnement", tags: [],
    ingredients: [{ name: "pommes de terre", quantity: "6-8" }, { name: "lait ou crème", quantity: "125 ml" }, { name: "beurre", quantity: "60 ml" }, { name: "sel", quantity: "au goût" }],
    steps: ["Peler et couper les pommes de terre, cuire dans l'eau bouillante salée 15-18 min.", "Égoutter, piler avec le beurre et le lait chaud.", "Assaisonner au goût."] },
  { title: "Salade César rapide", category: "accompagnement", tags: ["rapide", "sans cuisson"],
    ingredients: [{ name: "laitue romaine", quantity: "1" }, { name: "vinaigrette César du commerce", quantity: "80 ml" }, { name: "parmesan râpé", quantity: "60 ml" }, { name: "croûtons", quantity: "250 ml" }],
    steps: ["Laver et couper la laitue.", "Mélanger avec la vinaigrette, le parmesan et les croûtons juste avant de servir."] },
  { title: "Légumes rôtis au four", category: "accompagnement", tags: ["four"],
    ingredients: [{ name: "carottes", quantity: "3" }, { name: "courgettes", quantity: "2" }, { name: "poivrons", quantity: "1" }, { name: "huile d'olive", quantity: "2 c. à soupe" }, { name: "sel et poivre", quantity: "au goût" }],
    steps: ["Préchauffer le four à 425°F (220°C).", "Couper les légumes en morceaux, mélanger avec l'huile, le sel et le poivre.", "Étaler sur une plaque, cuire 20-25 min en remuant à mi-cuisson."] },
  { title: "Riz mexicain", category: "accompagnement", tags: [],
    ingredients: [{ name: "riz", quantity: "375 ml" }, { name: "tomates en dés", quantity: "250 ml" }, { name: "bouillon de légumes", quantity: "375 ml" }, { name: "cumin", quantity: "1 c. à thé" }, { name: "oignon haché", quantity: "1/4" }],
    steps: ["Faire revenir l'oignon, ajouter le riz et le cumin, remuer 1 min.", "Ajouter les tomates et le bouillon, porter à ébullition.", "Couvrir, cuire à feu doux 18-20 min."] },
  { title: "Salade de chou crémeuse (coleslaw)", category: "accompagnement", tags: ["sans cuisson"],
    ingredients: [{ name: "chou vert râpé", quantity: "500 ml" }, { name: "carotte râpée", quantity: "1" }, { name: "mayonnaise", quantity: "80 ml" }, { name: "vinaigre", quantity: "1 c. à soupe" }, { name: "sucre", quantity: "1 c. à thé" }],
    steps: ["Mélanger le chou et la carotte râpés.", "Fouetter la mayonnaise, le vinaigre et le sucre, verser sur le chou.", "Bien mélanger, laisser reposer 15 min au frigo avant de servir."] },
  { title: "Haricots verts amandine", category: "accompagnement", tags: ["rapide"],
    ingredients: [{ name: "haricots verts", quantity: "500 g" }, { name: "amandes effilées", quantity: "60 ml" }, { name: "beurre", quantity: "1 c. à soupe" }, { name: "sel", quantity: "au goût" }],
    steps: ["Cuire les haricots à la vapeur ou à l'eau bouillante 5-6 min.", "Faire dorer les amandes dans le beurre 1-2 min.", "Mélanger avec les haricots égouttés, saler."] },
  { title: "Quinoa aux herbes", category: "accompagnement", tags: ["rapide"],
    ingredients: [{ name: "quinoa", quantity: "250 ml" }, { name: "bouillon de légumes", quantity: "500 ml" }, { name: "persil ou herbes fraîches", quantity: "2 c. à soupe" }, { name: "jus de citron", quantity: "1 c. à soupe" }],
    steps: ["Rincer le quinoa, cuire dans le bouillon 15 min jusqu'à absorption.", "Laisser reposer 5 min, égrainer à la fourchette.", "Mélanger avec les herbes et le jus de citron."] },
];

// Marinades supplémentaires ciblées poulet et bœuf.
const CHICKEN_BEEF_MARINADES = [
  { title: "Marinade bourbon et cassonade", category: "marinade", tags: ["boeuf"],
    ingredients: [{ name: "bourbon ou whisky", quantity: "60 ml" }, { name: "cassonade", quantity: "60 ml" }, { name: "sauce soya", quantity: "60 ml" }, { name: "ail", quantity: "2 gousses" }],
    steps: ["Mélanger tous les ingrédients dans un bol ou un sac hermétique.", "Ajouter le bœuf et bien enrober.", "Laisser mariner au moins 1 h, idéalement toute une nuit.", "Cuire à la poêle ou au BBQ."] },
  { title: "Marinade chimichurri", category: "marinade", tags: ["boeuf"],
    ingredients: [{ name: "persil frais haché", quantity: "125 ml" }, { name: "ail", quantity: "3 gousses" }, { name: "vinaigre de vin rouge", quantity: "2 c. à soupe" }, { name: "huile d'olive", quantity: "80 ml" }, { name: "origan séché", quantity: "1 c. à thé" }, { name: "flocons de piment", quantity: "1/4 c. à thé" }],
    steps: ["Mélanger tous les ingrédients dans un bol.", "Ajouter le bœuf et bien enrober (ou servir en sauce à part).", "Laisser mariner 30 min à quelques heures.", "Cuire à la poêle ou au BBQ."] },
  { title: "Marinade vin rouge et romarin", category: "marinade", tags: ["boeuf"],
    ingredients: [{ name: "vin rouge", quantity: "125 ml" }, { name: "romarin frais ou séché", quantity: "1 c. à soupe" }, { name: "ail", quantity: "2 gousses" }, { name: "huile d'olive", quantity: "60 ml" }],
    steps: ["Mélanger tous les ingrédients dans un bol ou un sac hermétique.", "Ajouter le bœuf et bien enrober.", "Laisser mariner au moins 2 h, idéalement toute une nuit.", "Cuire à la poêle ou au four."] },
  { title: "Marinade poulet à l'orange et gingembre", category: "marinade", tags: ["poulet"],
    ingredients: [{ name: "jus d'orange", quantity: "125 ml" }, { name: "gingembre râpé", quantity: "1 c. à thé" }, { name: "sauce soya", quantity: "60 ml" }, { name: "ail", quantity: "2 gousses" }],
    steps: ["Mélanger tous les ingrédients dans un bol ou un sac hermétique.", "Ajouter le poulet et bien enrober.", "Laisser mariner 30 min à quelques heures.", "Cuire à la poêle, au four ou au BBQ."] },
  { title: "Marinade poulet buffalo", category: "marinade", tags: ["poulet"],
    ingredients: [{ name: "sauce piquante type Frank's", quantity: "80 ml" }, { name: "beurre fondu", quantity: "2 c. à soupe" }, { name: "ail", quantity: "1 gousse" }],
    steps: ["Mélanger tous les ingrédients dans un bol.", "Ajouter le poulet et bien enrober.", "Laisser mariner 30 min à quelques heures.", "Cuire au four ou à la poêle."] },
  { title: "Marinade poulet à la grecque", category: "marinade", tags: ["poulet"],
    ingredients: [{ name: "yogourt nature", quantity: "125 ml" }, { name: "jus de citron", quantity: "2 c. à soupe" }, { name: "huile d'olive", quantity: "2 c. à soupe" }, { name: "origan séché", quantity: "1 c. à thé" }, { name: "ail", quantity: "2 gousses" }],
    steps: ["Mélanger tous les ingrédients dans un bol.", "Ajouter le poulet et bien enrober.", "Laisser mariner au moins 1 h, idéalement toute une nuit.", "Cuire au four ou au BBQ."] },
];

const SEED_MEALS = [
  { title: "Pâtes à la sauce tomate et boeuf haché", category: "souper", tags: ["rapide", "boeuf"],  ingredients: [{ name: "pâtes", quantity: "700 g" }, { name: "boeuf haché", quantity: "700 g" }, { name: "sauce tomate", quantity: "700 ml (2 boîtes)" }, { name: "oignon", quantity: "1 gros" }, { name: "ail", quantity: "3 gousses" }, { name: "parmesan", quantity: "100 g" }], steps: ["Faire cuire les pâtes selon les instructions du paquet.", "Dans une poêle, faire revenir l'oignon et l'ail hachés 2-3 min.", "Ajouter le boeuf haché, cuire en défaisant à la fourchette jusqu'à ce qu'il ne soit plus rosé.", "Verser la sauce tomate, laisser mijoter 10 min à feu doux.", "Mélanger aux pâtes égouttées, servir avec du parmesan râpé."] },
  { title: "Poulet général tao maison", category: "souper", tags: ["poêle", "asiatique", "poulet", "riz"],  ingredients: [{ name: "poulet", quantity: "900 g" }, { name: "brocoli", quantity: "500 g" }, { name: "sauce soya", quantity: "60 ml" }, { name: "ail", quantity: "3 gousses" }, { name: "gingembre", quantity: "2,5 cm" }, { name: "riz", quantity: "600 g (sec)" }], steps: ["Cuire le riz selon les instructions du paquet.", "Couper le poulet en cubes, faire dorer dans une poêle huilée.", "Ajouter l'ail et le gingembre hachés, cuire 1 min.", "Ajouter le brocoli en bouquets, cuire 3-4 min.", "Verser la sauce soya (et un peu de miel ou sirop d'érable si désiré), bien enrober.", "Servir sur le riz chaud."] },
  { title: "Chili con carne", category: "souper", tags: ["mijoteuse", "boeuf"],  ingredients: [{ name: "boeuf haché", quantity: "700 g" }, { name: "haricots rouges", quantity: "2 boîtes (540 ml)" }, { name: "tomates en dés", quantity: "2 boîtes" }, { name: "oignon", quantity: "1 gros" }, { name: "poivron", quantity: "2" }, { name: "épices à chili", quantity: "3 c. à soupe" }], steps: ["Faire revenir l'oignon et le poivron hachés dans une grande casserole.", "Ajouter le boeuf haché, cuire jusqu'à coloration.", "Ajouter les tomates en dés, les haricots rouges égouttés et les épices à chili.", "Laisser mijoter à feu doux 25-30 min en remuant de temps en temps.", "Goûter et rectifier l'assaisonnement avant de servir."] },
  { title: "Pâté chinois", category: "souper", tags: ["classique", "boeuf"],  ingredients: [{ name: "boeuf haché", quantity: "700 g" }, { name: "maïs en crème", quantity: "2 boîtes (341 ml)" }, { name: "pomme de terre", quantity: "1,5 kg" }, { name: "oignon", quantity: "1" }], steps: ["Faire cuire et piler les pommes de terre en purée.", "Faire revenir l'oignon haché, ajouter le boeuf haché et cuire complètement; assaisonner.", "Dans un plat allant au four, étaler la couche de boeuf, puis le maïs en crème, puis la purée.", "Passer sous le gril quelques minutes pour dorer le dessus.", "Laisser reposer 5 min avant de servir."] },
  { title: "Saumon grillé et légumes rôtis", category: "souper", tags: ["four", "santé", "saumon"],  ingredients: [{ name: "saumon", quantity: "900 g (6 portions)" }, { name: "brocoli", quantity: "500 g" }, { name: "patate", quantity: "1 kg" }, { name: "citron", quantity: "2" }, { name: "huile d'olive", quantity: "3 c. à soupe" }], steps: ["Préchauffer le four à 400°F (200°C).", "Couper les patates en morceaux, enrober d'huile d'olive, sel et poivre; enfourner 20 min.", "Ajouter le brocoli sur la plaque, poursuivre la cuisson 10 min.", "Placer le saumon sur la plaque, arroser de jus de citron et d'huile d'olive.", "Cuire encore 12-15 min jusqu'à ce que le saumon s'effeuille facilement."] },
  { title: "Tacos au poulet", category: "souper", tags: ["rapide", "poulet"],  ingredients: [{ name: "poulet", quantity: "800 g" }, { name: "tortillas", quantity: "12" }, { name: "laitue", quantity: "1/2" }, { name: "tomate", quantity: "3" }, { name: "fromage", quantity: "200 g râpé" }, { name: "salsa", quantity: "250 ml" }], steps: ["Couper le poulet en lanières, assaisonner (cumin, paprika, sel).", "Cuire à la poêle 6-8 min jusqu'à cuisson complète.", "Réchauffer les tortillas.", "Garnir chaque tortilla de poulet, laitue, tomate, fromage râpé et salsa.", "Servir immédiatement."] },
  { title: "Soupe minestrone", category: "souper", tags: ["végé", "mijoteuse", "soupe"],  ingredients: [{ name: "légumes variés", quantity: "800 g" }, { name: "pâtes", quantity: "200 g" }, { name: "tomates en dés", quantity: "2 boîtes" }, { name: "bouillon de légumes", quantity: "2 L" }], steps: ["Faire revenir les légumes coupés en dés dans un peu d'huile 5 min.", "Ajouter les tomates en dés et le bouillon de légumes.", "Porter à ébullition, puis laisser mijoter 15 min.", "Ajouter les petites pâtes, cuire encore 10 min jusqu'à tendreté.", "Assaisonner et servir avec du parmesan si désiré."] },
  { title: "Pizza maison", category: "souper", tags: ["week-end"],  ingredients: [{ name: "pâte à pizza", quantity: "2 grandes (ou 900 g)" }, { name: "sauce tomate", quantity: "500 ml" }, { name: "fromage", quantity: "400 g" }, { name: "garnitures au choix", quantity: "au goût" }], steps: ["Préchauffer le four à 450°F (230°C).", "Étaler la pâte sur une plaque farinée.", "Couvrir de sauce tomate, puis de fromage râpé et des garnitures choisies.", "Cuire 12-15 min jusqu'à ce que le fromage soit doré et bouillonnant.", "Laisser reposer 2-3 min avant de trancher."] },
  { title: "Riz frit aux légumes et oeufs", category: "souper", tags: ["rapide", "végé", "riz"],  ingredients: [{ name: "riz", quantity: "450 g (sec)" }, { name: "oeuf", quantity: "6" }, { name: "légumes mélangés", quantity: "400 g" }, { name: "sauce soya", quantity: "60 ml" }], steps: ["Utiliser du riz cuit refroidi (idéalement de la veille).", "Faire sauter les légumes dans un wok ou une grande poêle 3-4 min.", "Pousser sur le côté, casser les oeufs et brouiller dans l'espace libre.", "Ajouter le riz, mélanger le tout, arroser de sauce soya.", "Faire sauter 3-4 min jusqu'à ce que tout soit bien chaud."] },
  { title: "Fajitas au boeuf", category: "souper", tags: ["poêle", "boeuf"],  ingredients: [{ name: "boeuf en lanières", quantity: "800 g" }, { name: "poivron", quantity: "3" }, { name: "oignon", quantity: "2" }, { name: "tortillas", quantity: "12" }, { name: "épices fajitas", quantity: "2 sachets" }], steps: ["Assaisonner le boeuf en lanières avec les épices à fajitas.", "Cuire à feu vif dans une poêle 4-5 min, réserver.", "Faire sauter le poivron et l'oignon en lanières 4-5 min.", "Remettre le boeuf, mélanger et réchauffer 1 min.", "Servir chaud avec les tortillas et garnitures au choix."] },
  { title: "Macaroni au fromage maison", category: "souper", tags: ["confort"],  ingredients: [{ name: "pâtes", quantity: "600 g" }, { name: "fromage", quantity: "400 g" }, { name: "lait", quantity: "750 ml" }, { name: "beurre", quantity: "60 g" }, { name: "farine", quantity: "60 g" }], steps: ["Cuire les pâtes selon les instructions, égoutter.", "Dans une casserole, faire fondre le beurre, incorporer la farine et cuire 1 min.", "Ajouter le lait graduellement en fouettant, cuire jusqu'à épaississement.", "Retirer du feu, incorporer le fromage râpé jusqu'à ce qu'il soit fondu.", "Mélanger la sauce aux pâtes et servir chaud."] },
  { title: "Soupe won-ton", category: "souper", tags: ["asiatique", "soupe"],  ingredients: [{ name: "won-ton", quantity: "24-30" }, { name: "bouillon de poulet", quantity: "2 L" }, { name: "bok choy", quantity: "400 g" }, { name: "gingembre", quantity: "2,5 cm" }], steps: ["Porter le bouillon de poulet à ébullition avec des tranches de gingembre.", "Ajouter les won-tons (frais ou surgelés), cuire selon les instructions du paquet.", "Ajouter le bok choy coupé, cuire 2-3 min jusqu'à tendreté.", "Rectifier l'assaisonnement avec un peu de sauce soya.", "Servir bien chaud."] },
  { title: "Burger maison", category: "souper", tags: ["week-end", "boeuf"],  ingredients: [{ name: "boeuf haché", quantity: "900 g (6 x 150 g)" }, { name: "pain à burger", quantity: "6" }, { name: "laitue", quantity: "au goût" }, { name: "tomate", quantity: "2" }, { name: "fromage", quantity: "6 tranches" }], steps: ["Façonner le boeuf haché assaisonné en galettes.", "Cuire à la poêle ou au BBQ 4-5 min par côté.", "Ajouter une tranche de fromage à la fin pour la faire fondre.", "Griller légèrement les pains.", "Assembler avec laitue, tomate et condiments au choix."] },
  { title: "Poitrines de poulet à l'érable et moutarde", category: "souper", tags: ["four", "poulet"],  ingredients: [{ name: "poulet", quantity: "6 poitrines (~1,2 kg)" }, { name: "sirop d'érable", quantity: "125 ml" }, { name: "moutarde de Dijon", quantity: "60 ml" }, { name: "ail", quantity: "3 gousses" }], steps: ["Préchauffer le four à 375°F (190°C).", "Mélanger le sirop d'érable, la moutarde de Dijon et l'ail émincé.", "Badigeonner les poitrines de poulet de ce mélange dans un plat allant au four.", "Cuire 25-30 min jusqu'à ce que le poulet soit bien cuit, en arrosant à mi-cuisson.", "Laisser reposer 5 min avant de servir."] },
  { title: "Quiche aux légumes", category: "souper", tags: ["végé", "four"],  ingredients: [{ name: "pâte à tarte", quantity: "2" }, { name: "oeuf", quantity: "8" }, { name: "crème", quantity: "500 ml" }, { name: "légumes", quantity: "400 g" }, { name: "fromage", quantity: "200 g" }], steps: ["Préchauffer le four à 375°F (190°C) et foncer un moule avec la pâte.", "Faire revenir les légumes coupés en dés quelques minutes.", "Fouetter les oeufs avec la crème, saler et poivrer.", "Étaler les légumes et le fromage râpé dans le fond de tarte, verser le mélange d'oeufs.", "Cuire 35-40 min jusqu'à ce que la quiche soit prise et dorée."] },
  { title: "Sauté de tofu à l'asiatique", category: "souper", tags: ["végé", "rapide", "riz"],  ingredients: [{ name: "tofu", quantity: "700 g" }, { name: "légumes", quantity: "500 g" }, { name: "sauce soya", quantity: "60 ml" }, { name: "gingembre", quantity: "2,5 cm" }, { name: "riz", quantity: "600 g (sec)" }], steps: ["Cuire le riz selon les instructions du paquet.", "Éponger et couper le tofu en cubes, faire dorer dans une poêle huilée.", "Réserver le tofu, faire sauter les légumes avec le gingembre 3-4 min.", "Remettre le tofu, ajouter la sauce soya, mélanger.", "Servir chaud sur le riz."] },
  { title: "Chaudrée de poisson", category: "souper", tags: ["mijoteuse", "poisson", "soupe"],  ingredients: [{ name: "poisson", quantity: "800 g" }, { name: "pomme de terre", quantity: "700 g" }, { name: "maïs en crème", quantity: "2 boîtes" }, { name: "crème", quantity: "500 ml" }, { name: "bouillon", quantity: "1 L" }], steps: ["Faire revenir un oignon haché dans une casserole.", "Ajouter les pommes de terre en dés et le bouillon, cuire 15 min jusqu'à tendreté.", "Ajouter le maïs en crème et la crème, mélanger.", "Ajouter le poisson coupé en morceaux, cuire 5-7 min à feu doux jusqu'à ce qu'il soit cuit.", "Assaisonner et servir chaud."] },
  { title: "Wraps au poulet César", category: "souper", tags: ["rapide", "poulet"],  ingredients: [{ name: "poulet", quantity: "600 g cuit" }, { name: "laitue", quantity: "1 romaine" }, { name: "parmesan", quantity: "100 g" }, { name: "sauce césar", quantity: "250 ml" }, { name: "tortillas", quantity: "6-8" }], steps: ["Cuire ou utiliser du poulet déjà cuit, coupé en lanières.", "Mélanger la laitue déchiquetée avec la sauce césar et le parmesan.", "Répartir le mélange et le poulet au centre de chaque tortilla.", "Rouler fermement en repliant les côtés.", "Couper en deux et servir."] },
  { title: "Boulettes de viande à la suédoise", category: "souper", tags: ["mijoteuse", "confort", "boeuf"],  ingredients: [{ name: "boeuf haché", quantity: "900 g" }, { name: "chapelure", quantity: "150 g" }, { name: "oeuf", quantity: "2" }, { name: "sauce", quantity: "500 ml" }, { name: "pomme de terre", quantity: "1,2 kg (purée)" }], steps: ["Mélanger le boeuf haché, la chapelure et l'oeuf; façonner en boulettes.", "Faire dorer les boulettes dans une poêle de tous les côtés.", "Préparer une sauce brune (ou utiliser une sauce du commerce), verser sur les boulettes.", "Laisser mijoter 15-20 min à feu doux.", "Servir avec une purée de pommes de terre."] },
  { title: "Curry de légumes et pois chiches", category: "souper", tags: ["végé", "mijoteuse", "riz"],  ingredients: [{ name: "pois chiches", quantity: "3 boîtes" }, { name: "lait de coco", quantity: "2 boîtes (400 ml)" }, { name: "légumes", quantity: "600 g" }, { name: "cari", quantity: "3 c. à soupe" }, { name: "riz", quantity: "600 g (sec)" }], steps: ["Cuire le riz selon les instructions du paquet.", "Faire revenir un oignon avec la poudre de cari 1-2 min.", "Ajouter les légumes coupés, cuire 3-4 min.", "Ajouter les pois chiches égouttés et le lait de coco, laisser mijoter 15 min.", "Servir chaud sur le riz."] },
  { title: "Riz au poulet et légumes à la mijoteuse", category: "souper", tags: ["mijoteuse", "poulet", "riz"],  ingredients: [{ name: "poulet", quantity: "900 g" }, { name: "riz", quantity: "500 g (sec)" }, { name: "bouillon", quantity: "1 L" }, { name: "carotte", quantity: "4" }, { name: "oignon", quantity: "2" }], steps: ["Déposer le poulet, les carottes et l'oignon coupés dans la mijoteuse.", "Ajouter le bouillon, couvrir et cuire 4-5 h à basse température.", "Environ 30 min avant la fin, ajouter le riz.", "Poursuivre la cuisson jusqu'à ce que le riz soit tendre.", "Effilocher le poulet si désiré et servir."] },
  { title: "Soupe au poulet et nouilles", category: "souper", tags: ["confort", "poulet", "soupe"],  ingredients: [{ name: "poulet", quantity: "500 g cuit" }, { name: "nouilles", quantity: "300 g" }, { name: "carotte", quantity: "3" }, { name: "céleri", quantity: "3 branches" }, { name: "bouillon de poulet", quantity: "2,5 L" }], steps: ["Porter le bouillon de poulet à ébullition avec la carotte et le céleri en dés.", "Laisser mijoter 10 min jusqu'à ce que les légumes soient tendres.", "Ajouter le poulet cuit effiloché et les nouilles.", "Cuire encore 5-7 min jusqu'à ce que les nouilles soient tendres.", "Assaisonner et servir chaud."] },
  { title: "Saumon teriyaki et riz", category: "souper", tags: ["rapide", "saumon", "riz"],  ingredients: [{ name: "saumon", quantity: "900 g" }, { name: "sauce teriyaki", quantity: "180 ml" }, { name: "riz", quantity: "600 g (sec)" }, { name: "brocoli", quantity: "500 g" }], steps: ["Cuire le riz selon les instructions du paquet.", "Faire cuire le saumon à la poêle 3-4 min de chaque côté.", "Ajouter la sauce teriyaki en fin de cuisson, laisser réduire légèrement en nappant le poisson.", "Cuire le brocoli à la vapeur quelques minutes.", "Servir le saumon sur le riz avec le brocoli."] },
  { title: "Croustade aux pommes", category: "dessert", tags: ["four"],  ingredients: [{ name: "pomme", quantity: "8-10" }, { name: "farine", quantity: "200 g" }, { name: "cassonade", quantity: "250 g" }, { name: "beurre", quantity: "150 g" }, { name: "avoine", quantity: "150 g" }, { name: "cannelle", quantity: "2 c. à thé" }], steps: ["Préchauffer le four à 350°F (175°C).", "Peler et trancher les pommes, mélanger avec un peu de cannelle et de cassonade; déposer dans un plat.", "Mélanger la farine, l'avoine, la cassonade et le beurre froid jusqu'à consistance grumeleuse.", "Répartir ce mélange sur les pommes.", "Cuire 35-40 min jusqu'à ce que le dessus soit doré et les pommes tendres."] },
  { title: "Pouding chômeur", category: "dessert", tags: ["classique"],  ingredients: [{ name: "farine", quantity: "300 g" }, { name: "cassonade", quantity: "400 g" }, { name: "beurre", quantity: "120 g" }, { name: "lait", quantity: "250 ml" }, { name: "sirop d'érable", quantity: "300 ml" }], steps: ["Préchauffer le four à 350°F (175°C).", "Préparer une pâte simple avec la farine, le beurre et le lait; verser dans un plat.", "Porter à ébullition le sirop d'érable et la cassonade avec un peu d'eau ou de crème.", "Verser ce sirop chaud sur la pâte sans mélanger.", "Cuire 35-40 min jusqu'à ce que le dessus soit doré."] },
  { title: "Brownies au chocolat", category: "dessert", tags: ["four"],  ingredients: [{ name: "chocolat", quantity: "200 g" }, { name: "beurre", quantity: "150 g" }, { name: "sucre", quantity: "250 g" }, { name: "oeuf", quantity: "3" }, { name: "farine", quantity: "150 g" }], steps: ["Préchauffer le four à 350°F (175°C) et tapisser un moule carré.", "Faire fondre le chocolat et le beurre ensemble.", "Incorporer le sucre, puis les oeufs un à un en fouettant.", "Incorporer la farine délicatement jusqu'à homogénéité.", "Cuire 25-30 min; laisser refroidir avant de couper."] },
  { title: "Tarte au sucre", category: "dessert", tags: ["classique"],  ingredients: [{ name: "cassonade", quantity: "400 g" }, { name: "crème", quantity: "250 ml" }, { name: "beurre", quantity: "100 g" }, { name: "farine", quantity: "30 g" }, { name: "pâte à tarte", quantity: "1" }], steps: ["Préchauffer le four à 350°F (175°C) et foncer une assiette avec la pâte.", "Mélanger la cassonade, la crème et le beurre fondu dans une casserole.", "Chauffer doucement en remuant jusqu'à ce que le mélange soit homogène.", "Incorporer un peu de farine pour épaissir légèrement, verser dans le fond de tarte.", "Cuire 30-35 min jusqu'à ce que le centre soit à peine pris; laisser refroidir avant de servir."] },
  { title: "Salade de fruits frais", category: "dessert", tags: ["rapide", "santé"],  ingredients: [{ name: "fruits", quantity: "1,2 kg" }, { name: "miel", quantity: "60 ml" }, { name: "menthe", quantity: "quelques feuilles" }], steps: ["Laver et couper les fruits de saison en morceaux.", "Mélanger délicatement dans un grand bol.", "Arroser d'un filet de miel et de jus de citron si désiré.", "Ajouter quelques feuilles de menthe fraîche ciselée.", "Réfrigérer 15-20 min avant de servir."] },
  { title: "Pouding au riz", category: "dessert", tags: ["riz", "confort"],  ingredients: [{ name: "riz", quantity: "250 g" }, { name: "lait", quantity: "1,5 L" }, { name: "sucre", quantity: "150 g" }, { name: "cannelle", quantity: "1 c. à thé" }, { name: "vanille", quantity: "1 c. à thé" }], steps: ["Cuire le riz avec le lait à feu doux en remuant souvent, environ 20-25 min.", "Ajouter le sucre et la vanille, poursuivre la cuisson jusqu'à consistance crémeuse.", "Retirer du feu une fois le riz bien tendre et le mélange épaissi.", "Saupoudrer de cannelle.", "Servir chaud ou froid."] },
];

const MEMBER_COLORS = ["#6B9B5E", "#6B8CA8", "#A6634A", "#C98A2B", "#8C6A9B", "#4E8C97"];
const TASK_FREQUENCIES = { unique: "Une fois", quotidien: "Chaque jour", hebdomadaire: "Chaque semaine", auxDeuxSemaines: "Aux 2 semaines" };

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`);

function resizeImage(file, maxW = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(LS_PREFIX + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); } catch (e) { console.error("Erreur de sauvegarde locale", e); }
}

// ============================================================
// Couche d'accès à Supabase — remplace complètement l'ancien
// backend Express. La sécurité (quelle famille voit quoi) est
// gérée automatiquement par les règles RLS de la base de données,
// pas par le code ici — on n'a jamais besoin de filtrer par famille
// manuellement dans les requêtes de lecture.
// ============================================================

// Retrouve la famille de l'utilisateur connecté — nécessaire pour
// savoir quel family_id inscrire sur chaque nouvelle ligne.
async function getMyFamilyId() {
  const { data, error } = await supabase.from("family_users").select("family_id").limit(1).single();
  if (error) { console.error("Erreur récupération famille:", error.message); return null; }
  return data?.family_id || null;
}

const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const camelToSnake = (s) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
function rowToCamel(row) {
  if (!row) return row;
  const out = {};
  for (const k of Object.keys(row)) out[snakeToCamel(k)] = row[k];
  return out;
}
function objToSnake(obj) {
  const out = {};
  for (const k of Object.keys(obj)) out[camelToSnake(k)] = obj[k];
  return out;
}

// Charge une table Supabase en entier (déjà filtrée par famille grâce
// à RLS) et convertit chaque ligne en camelCase pour l'app.
async function loadTable(table, orderBy) {
  let query = supabase.from(table).select("*");
  if (orderBy) query = query.order(orderBy, { ascending: true });
  const { data, error } = await query;
  if (error) { console.error(`Erreur chargement ${table}:`, error.message); return []; }
  return (data || []).map(rowToCamel);
}

async function insertRow(table, familyId, obj) {
  const payload = objToSnake({ ...obj, familyId });
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) { console.error(`Erreur ajout ${table}:`, error.message); return null; }
  return rowToCamel(data);
}
async function updateRow(table, id, patch) {
  const payload = objToSnake(patch);
  const { error } = await supabase.from(table).update(payload).eq("id", id);
  if (error) { console.error(`Erreur modification ${table}:`, error.message); return false; }
  return true;
}
async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) { console.error(`Erreur suppression ${table}:`, error.message); return false; }
  return true;
}
async function upsertSettings(familyId, patch) {
  const payload = objToSnake({ ...patch, familyId });
  const { error } = await supabase.from("settings").upsert(payload, { onConflict: "family_id" });
  if (error) { console.error("Erreur sauvegarde réglages:", error.message); return false; }
  return true;
}

// Compare l'ancien tableau au nouveau et n'envoie à Supabase que ce qui a
// vraiment changé (ajouts, modifications, suppressions) — ça évite de devoir
// réécrire chacune des dizaines de fonctions qui ajoutent/modifient/suppriment
// un article, une tâche, etc. dans le reste de l'app.
async function syncArrayDiff(table, prevArr, nextArr, familyId) {
  const prevById = new Map(prevArr.map(x => [x.id, x]));
  const nextIds = new Set(nextArr.map(x => x.id));

  for (const item of prevArr) {
    if (!nextIds.has(item.id)) await deleteRow(table, item.id);
  }
  for (const item of nextArr) {
    const prevItem = prevById.get(item.id);
    if (!prevItem) {
      await insertRow(table, familyId, item);
    } else if (JSON.stringify(prevItem) !== JSON.stringify(item)) {
      await updateRow(table, item.id, item);
    }
  }
}

// ⚠️ TEMPORAIRE : les notifications (SMS, push) ne sont pas encore branchées à
// Supabase — ça demande un petit service séparé (Edge Function) qu'on construira
// à une prochaine étape. Ces fonctions évitent que l'app plante en attendant,
// mais aucun SMS ni notification ne part réellement pour l'instant.
const cleanBackendUrl = () => "";
async function pushToBackend() { return false; }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function mostRecentWeekday(dow) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() - dow + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}
function startOfWeek(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
function fmtDayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "short" });
}
function isRoutineDoneToday(task) {
  const checkedToday = (task.checkedSteps && task.checkedSteps[todayStr()]) || [];
  return (task.steps || []).length > 0 && checkedToday.length >= task.steps.length;
}
function isTaskDone(task) {
  if (task.type === "routine") return isRoutineDoneToday(task);
  if (task.rotation && task.rotation.length) return false;
  if (!task.lastDoneDate) return false;
  if (task.frequency === "unique") return true;
  if (task.frequency === "quotidien") return task.lastDoneDate === todayStr();
  if (task.frequency === "hebdomadaire") {
    if (Number.isInteger(task.dueDayOfWeek)) return task.lastDoneDate >= mostRecentWeekday(task.dueDayOfWeek);
    return startOfWeek(task.lastDoneDate) === startOfWeek(todayStr());
  }
  if (task.frequency === "auxDeuxSemaines") {
    const last = new Date(task.lastDoneDate + "T00:00:00");
    const today = new Date(todayStr() + "T00:00:00");
    const daysSinceDone = Math.round((today - last) / 86400000);
    return daysSinceDone < 14;
  }
  return false;
}

// Émojis suggérés pour bâtir une routine visuelle — libre à vous d'en choisir
// d'autres via la saisie manuelle.
const ROUTINE_EMOJIS = ["🪥", "🪮", "🚿", "🛁", "🧼", "🧴", "👕", "🧦", "👖", "🎒", "🍱", "🥣", "🍎", "💧", "📖", "🧸", "💡", "🛏️", "🚽", "🧹", "⏰", "🌞", "🌙", "✅"];

const COLORS = { paper: "#EDF1E7", card: "#FBF9F3", ink: "#2B2A22", accent: "#C98A2B", accentDark: "#A96F1E", muted: "#767159", danger: "#A6634A" };

function App({ session }) {
  const [loaded, setLoaded] = useState(false);
  const [groceryItems, setGroceryItems] = useState([]);
  const [mealIdeas, setMealIdeas] = useState([]);
  const [weekPlan, setWeekPlan] = useState([]);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rewardCharts, setRewardCharts] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  // "Qui suis-je sur cet appareil" — volontairement 100% local (jamais synchronisé
  // avec le serveur ni les autres appareils). Chaque iPad garde sa propre identité.
  const [myMemberId, setMyMemberIdState] = useState(() => lsGet("myMemberId", ""));
  const setMyMemberId = (id) => { setMyMemberIdState(id); lsSet("myMemberId", id); };
  const [tab, setTab] = useState("semaine");
  const [weekStart, setWeekStart] = useState(startOfWeek(todayStr()));
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [pickingDay, setPickingDay] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddReward, setShowAddReward] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [saveErr, setSaveErr] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const tapCountRef = useRef({ count: 0, last: 0 });
  const lastLocalWriteRef = useRef(0);

  const [familyId, setFamilyId] = useState(null);

  const loadAll = useCallback(async () => {
    const famId = await getMyFamilyId();
    setFamilyId(famId);
    if (!famId) { setLoaded(true); return; }

    const [gi, mi0, wp, mb, tk, rc, settingsRes] = await Promise.all([
      loadTable("grocery_items"),
      loadTable("meal_ideas"),
      loadTable("week_plan"),
      loadTable("members"),
      loadTable("tasks"),
      loadTable("reward_charts"),
      supabase.from("settings").select("*").eq("family_id", famId).maybeSingle(),
    ]);

    let mi = mi0;
    if (mi.length === 0) {
      // Première ouverture pour cette famille : on amorce avec les idées de
      // repas suggérées, une seule fois.
      const seeded = SEED_MEALS.map(m => ({ id: uid(), ...m }));
      for (const meal of seeded) await insertRow("meal_ideas", famId, meal);
      mi = seeded;
    }

    const remoteSettings = settingsRes?.data ? rowToCamel(settingsRes.data) : {};
    const { familyId: _fid, updatedAt: _ua, ...cleanSettings } = remoteSettings;
    const s = { ...DEFAULT_SETTINGS, ...cleanSettings };

    setGroceryItems(gi); setMealIdeas(mi); setWeekPlan(wp); setMembers(mb); setTasks(tk); setRewardCharts(rc); setSettings(s);
    lsSet("settings", s);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => loadAll(), 30000);
    const onFocus = () => loadAll();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Note : les notifications (SMS et push) ne sont pas encore branchées dans ce
  // nouveau produit — elles demanderont un petit service séparé (Edge Function
  // Supabase) qu'on construira à une prochaine étape.

  // Avant de pousser un changement, on va d'abord chercher la version la plus
  // fraîche du serveur pour les AUTRES champs — pour ne jamais écraser un
  // changement récent fait par un autre appareil (ex. une tâche cochée pendant
  // qu'un autre appareil ajoutait un article) simplement parce que notre copie
  // locale de ce champ-là était un peu dépassée.
  const persistGrocery = (next) => { syncArrayDiff("grocery_items", groceryItems, next, familyId); setGroceryItems(next); lsSet("groceryItems", next); };
  const persistMeals = (next) => { syncArrayDiff("meal_ideas", mealIdeas, next, familyId); setMealIdeas(next); lsSet("mealIdeas", next); };
  const persistPlan = (next) => { syncArrayDiff("week_plan", weekPlan, next, familyId); setWeekPlan(next); lsSet("weekPlan", next); };
  const persistMembers = (next) => { syncArrayDiff("members", members, next, familyId); setMembers(next); lsSet("members", next); };
  const persistTasks = (next) => { syncArrayDiff("tasks", tasks, next, familyId); setTasks(next); lsSet("tasks", next); };
  const persistRewardCharts = (next) => { syncArrayDiff("reward_charts", rewardCharts, next, familyId); setRewardCharts(next); lsSet("rewardCharts", next); };

  const persistSettings = async (next) => {
    setSettings(next);
    lsSet("settings", next);
    if (!familyId) return;
    const ok = await upsertSettings(familyId, next);
    setSaveErr(!ok);
  };

  // Renvoie tout ce que cet appareil a en mémoire locale vers Supabase — utile
  // si un import de sauvegarde a laissé les choses dans un état incohérent.
  const forcePushAll = async () => {
    if (!familyId) return false;
    await syncArrayDiff("grocery_items", [], groceryItems, familyId);
    await syncArrayDiff("meal_ideas", [], mealIdeas, familyId);
    await syncArrayDiff("week_plan", [], weekPlan, familyId);
    await syncArrayDiff("members", [], members, familyId);
    await syncArrayDiff("tasks", [], tasks, familyId);
    await syncArrayDiff("reward_charts", [], rewardCharts, familyId);
    return true;
  };

  // Sauvegarde locale : un vrai fichier sur l'appareil, indépendant du serveur —
  // filet de sécurité supplémentaire.
  const exportBackup = () => {
    const data = { groceryItems, mealIdeas, weekPlan, members, tasks, rewardCharts, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sauvegarde-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== "object") throw new Error("format invalide");
      if (!window.confirm("Remplacer toutes les données actuelles par celles de ce fichier de sauvegarde? Cette action ne peut pas être annulée.")) return false;
      if (!familyId) return false;

      const gi = data.groceryItems || [];
      const mi = data.mealIdeas || [];
      const wp = data.weekPlan || [];
      const mb = data.members || [];
      const tk = data.tasks || [];
      const rc = data.rewardCharts || [];

      await syncArrayDiff("grocery_items", groceryItems, gi, familyId);
      await syncArrayDiff("meal_ideas", mealIdeas, mi, familyId);
      await syncArrayDiff("week_plan", weekPlan, wp, familyId);
      await syncArrayDiff("members", members, mb, familyId);
      await syncArrayDiff("tasks", tasks, tk, familyId);
      await syncArrayDiff("reward_charts", rewardCharts, rc, familyId);

      setGroceryItems(gi); setMealIdeas(mi); setWeekPlan(wp); setMembers(mb); setTasks(tk); setRewardCharts(rc);
      return true;
    } catch {
      window.alert("Ce fichier n'est pas une sauvegarde valide.");
      return false;
    }
  };


  const addMember = (name, phone, kidMode) => persistMembers([...members, { id: uid(), name, phone: phone || "", kidMode: !!kidMode, color: MEMBER_COLORS[members.length % MEMBER_COLORS.length] }]);
  const updateMember = (id, patch) => persistMembers(members.map(m => m.id === id ? { ...m, ...patch } : m));
  const deleteMember = (id) => {
    persistMembers(members.filter(m => m.id !== id));
    persistTasks(tasks.map(t => t.assignedTo === id ? { ...t, assignedTo: null } : t));
  };

  const addTask = (t) => persistTasks([...tasks, { id: uid(), lastDoneDate: null, ...t }]);
  const updateTask = (id, patch) => persistTasks(tasks.map(t => t.id === id ? { ...t, ...patch } : t));
  const deleteTask = (id) => persistTasks(tasks.filter(t => t.id !== id));
  const toggleTaskDone = (task) => updateTask(task.id, { lastDoneDate: isTaskDone(task) ? null : todayStr() });

  // Coche/décoche une étape d'une routine visuelle pour aujourd'hui. Quand toutes
  // les étapes sont cochées, on marque aussi lastDoneDate — pour que le backend
  // (relances, "c'est fait") traite une routine exactement comme une tâche normale.
  const toggleRoutineStep = (task, stepId) => {
    const today = todayStr();
    const checkedToday = (task.checkedSteps && task.checkedSteps[today]) || [];
    const wasAllDone = task.steps.length > 0 && checkedToday.length >= task.steps.length;
    const nextChecked = checkedToday.includes(stepId) ? checkedToday.filter(id => id !== stepId) : [...checkedToday, stepId];
    const allDone = task.steps.length > 0 && nextChecked.length >= task.steps.length;
    updateTask(task.id, {
      checkedSteps: { ...(task.checkedSteps || {}), [today]: nextChecked },
      lastDoneDate: allDone ? today : (task.lastDoneDate === today ? null : task.lastDoneDate),
    });

    // Si cette routine est liée à un défi récompense, la terminer coche
    // automatiquement une étoile pour aujourd'hui (une seule fois par jour, même
    // si on décoche puis recoche une étape par erreur).
    if (allDone && !wasAllDone && task.linkedRewardChartId) {
      const chart = rewardCharts.find(c => c.id === task.linkedRewardChartId);
      if (chart && !chart.history.includes(today)) markRewardNight(chart);
    }
  };

  const notifyTurn = (task, nextMember) => {
    if (!nextMember || !familyId) return;
    supabase.functions.invoke("notify", {
      body: { action: "send", familyId, memberId: nextMember.id, title: "🔄 C'est ton tour!", body: `${nextMember.name}, c'est ton tour pour "${task.title}"!`, notifyParent: !!task.notifyParent },
    }).catch(() => { /* silencieux — la tâche a quand même changé de tour */ });
  };

  const rotateTask = (task) => {
    const currentMemberId = task.rotation[task.rotationIndex];
    // Comptabilise combien de fois chaque personne a fait la tâche, pour pouvoir
    // l'afficher (ex. "Léa : 12 · Emma : 9").
    const completions = { ...(task.completions || {}), [currentMemberId]: ((task.completions || {})[currentMemberId] || 0) + 1 };

    // Si cette personne doit un tour de rattrapage (ex. une absence couverte par
    // quelqu'un d'autre plus tôt), elle refait la tâche une fois de plus avant que
    // le tour passe au suivant — le rattrapage se compte, mais le tour ne bouge pas.
    const debtOwed = (task.makeupDebt || {})[currentMemberId] || 0;
    if (debtOwed > 0) {
      const makeupDebt = { ...(task.makeupDebt || {}), [currentMemberId]: debtOwed - 1 };
      updateTask(task.id, { lastDoneDate: todayStr(), turnStartDate: todayStr(), completions, makeupDebt });
      return;
    }

    const nextIndex = (task.rotationIndex + 1) % task.rotation.length;
    updateTask(task.id, { rotationIndex: nextIndex, lastDoneDate: todayStr(), turnStartDate: todayStr(), completions });
    notifyTurn(task, members.find(m => m.id === task.rotation[nextIndex]));
  };

  // Utilisé quand la personne dont c'est le tour est absente et qu'une autre
  // s'en occupe à sa place : celle qui a couvert reçoit le crédit, le tour passe
  // normalement au suivant, mais l'absente devra un tour de rattrapage plus tard.
  const coverAbsence = (task, coveringMemberId) => {
    const absentMemberId = task.rotation[task.rotationIndex];
    const completions = { ...(task.completions || {}), [coveringMemberId]: ((task.completions || {})[coveringMemberId] || 0) + 1 };
    const makeupDebt = { ...(task.makeupDebt || {}), [absentMemberId]: ((task.makeupDebt || {})[absentMemberId] || 0) + 1 };
    const nextIndex = (task.rotationIndex + 1) % task.rotation.length;
    updateTask(task.id, { rotationIndex: nextIndex, lastDoneDate: todayStr(), turnStartDate: todayStr(), completions, makeupDebt });
    notifyTurn(task, members.find(m => m.id === task.rotation[nextIndex]));
  };

  const addGroceryItem = (item) => persistGrocery([...groceryItems, { id: uid(), checked: false, ...item }]);
  const toggleGroceryItem = (id) => persistGrocery(groceryItems.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const deleteGroceryItem = (id) => persistGrocery(groceryItems.filter(i => i.id !== id));
  const clearChecked = () => persistGrocery(groceryItems.filter(i => !i.checked));

  const addRewardChart = (chart) => persistRewardCharts([...rewardCharts, { id: uid(), progress: 0, history: [], milestonesReached: 0, ...chart }]);
  const updateRewardChart = (id, patch) => persistRewardCharts(rewardCharts.map(c => c.id === id ? { ...c, ...patch } : c));
  const deleteRewardChart = (id) => persistRewardCharts(rewardCharts.filter(c => c.id !== id));

  // Coche une nuit réussie sur le calendrier de récompense. Quand l'objectif est
  // atteint, le défi "monte de niveau" tout seul : la barre se vide et le prochain
  // objectif est plus grand (goal + increment) — le calendrier évolue avec l'enfant.
  const markRewardNight = (chart) => {
    const today = todayStr();
    if (chart.history.includes(today)) return; // déjà coché aujourd'hui
    const nextHistory = [...chart.history, today];
    const nextProgress = chart.progress + 1;
    if (nextProgress >= chart.goal) {
      updateRewardChart(chart.id, {
        history: nextHistory, progress: 0, goal: chart.goal + (chart.increment || 2),
        milestonesReached: (chart.milestonesReached || 0) + 1, awaitingReward: true,
      });
    } else {
      updateRewardChart(chart.id, { history: nextHistory, progress: nextProgress });
    }
  };
  const undoRewardNight = (chart) => {
    const today = todayStr();
    if (!chart.history.includes(today)) return;
    updateRewardChart(chart.id, { history: chart.history.filter(d => d !== today), progress: Math.max(0, chart.progress - 1) });
  };
  // L'enfant inscrit lui-même la récompense qu'il a choisie après avoir atteint un palier.
  const setRewardChoice = (chart, text) => {
    if (!text.trim()) return;
    updateRewardChart(chart.id, {
      rewards: [...(chart.rewards || []), { date: todayStr(), text: text.trim(), milestone: chart.milestonesReached }],
      awaitingReward: false,
    });
  };

  // Réinitialise complètement la liste — contrairement à "Effacer les cochés", ceci
  // signale explicitement au serveur qu'un vidage complet est voulu, pour qu'il
  // n'interprète pas ça comme une donnée manquante à protéger.
  const resetGroceryList = async () => {
    setGroceryItems([]);
    lsSet("groceryItems", []);
    if (settings.backendUrl) {
      const ok = await pushToBackend(settings.backendUrl, {
        groceryItems: [], mealIdeas, weekPlan, members, tasks, settings, resetFields: ["groceryItems"],
      });
      setSaveErr(!ok);
    }
  };

  const addMeal = (m) => persistMeals([...mealIdeas, { id: uid(), ...m }]);
  const addMarinades = () => {
    const existingTitles = new Set(mealIdeas.map(m => m.title.toLowerCase()));
    const toAdd = MARINADE_RECIPES.filter(r => !existingTitles.has(r.title.toLowerCase())).map(r => ({ id: uid(), ...r }));
    if (toAdd.length) persistMeals([...mealIdeas, ...toAdd]);
  };
  const addSnacks = () => {
    const existingTitles = new Set(mealIdeas.map(m => m.title.toLowerCase()));
    const toAdd = SNACK_RECIPES.filter(r => !existingTitles.has(r.title.toLowerCase())).map(r => ({ id: uid(), ...r }));
    if (toAdd.length) persistMeals([...mealIdeas, ...toAdd]);
  };
  const addPickyLunches = () => {
    const existingTitles = new Set(mealIdeas.map(m => m.title.toLowerCase()));
    const toAdd = PICKY_LUNCH_RECIPES.filter(r => !existingTitles.has(r.title.toLowerCase())).map(r => ({ id: uid(), ...r }));
    if (toAdd.length) persistMeals([...mealIdeas, ...toAdd]);
  };
  const addSideDishes = () => {
    const existingTitles = new Set(mealIdeas.map(m => m.title.toLowerCase()));
    const toAdd = SIDE_DISH_RECIPES.filter(r => !existingTitles.has(r.title.toLowerCase())).map(r => ({ id: uid(), ...r }));
    if (toAdd.length) persistMeals([...mealIdeas, ...toAdd]);
  };
  const addMoreMarinades = () => {
    const existingTitles = new Set(mealIdeas.map(m => m.title.toLowerCase()));
    const toAdd = CHICKEN_BEEF_MARINADES.filter(r => !existingTitles.has(r.title.toLowerCase())).map(r => ({ id: uid(), ...r }));
    if (toAdd.length) persistMeals([...mealIdeas, ...toAdd]);
  };
  const updateMeal = (id, patch) => persistMeals(mealIdeas.map(m => m.id === id ? { ...m, ...patch } : m));
  const deleteMeal = (id) => persistMeals(mealIdeas.filter(m => m.id !== id));

  const setDayPlan = (date, patch) => {
    const exists = weekPlan.find(p => p.date === date);
    const next = exists ? weekPlan.map(p => p.date === date ? { ...p, ...patch } : p) : [...weekPlan, { id: uid(), date, mealIdeaId: null, customTitle: null, ...patch }];
    persistPlan(next);

    const title = patch.customTitle || (patch.mealIdeaId ? mealById(patch.mealIdeaId)?.title : null);
    if (title && familyId) {
      const dayLabel = new Date(date + "T00:00:00").toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "short" });
      supabase.functions.invoke("notify", { body: { action: "broadcast", familyId, body: `🍽️ Menu ajouté — ${dayLabel} : ${title}` } })
        .catch(() => { /* silencieux — le menu est quand même enregistré */ });
    }
  };
  const clearDayPlan = (date) => persistPlan(weekPlan.filter(p => p.date !== date));

  const addIngredientsToGrocery = (meal) => {
    const existingNames = new Set(groceryItems.map(i => i.name.toLowerCase()));
    const toAdd = (meal.ingredients || []).filter(ing => !existingNames.has(ing.name.toLowerCase()))
      .map(ing => ({ id: uid(), name: ing.name, quantity: ing.quantity || "", aisle: guessAisle(ing.name), checked: false }));
    if (toAdd.length) persistGrocery([...groceryItems, ...toAdd]);
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const mealById = (id) => mealIdeas.find(m => m.id === id);

  // Un appareil "d'enfant" (identifié via Paramètres, avec l'accès restreint coché
  // sur ce membre) atterrit directement sur sa page "Moi" — routines et défis
  // récompense en grand — au lieu des onglets habituels, et les Paramètres sont
  // cachés du menu. Toucher le titre 5 fois de suite les fait réapparaître pour vous.
  const myMember = members.find(m => m.id === myMemberId);
  const isKidLocked = !!(myMember && myMember.kidMode) && !unlocked;
  useEffect(() => {
    if (loaded && myMember?.kidMode && !unlocked) setTab("moi");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, myMemberId]);

  const handleTitleTap = () => {
    const now = Date.now();
    const ref = tapCountRef.current;
    ref.count = (now - ref.last < 600) ? ref.count + 1 : 1;
    ref.last = now;
    if (ref.count >= 5) { setUnlocked(true); ref.count = 0; }
  };

  const [slowLoad, setSlowLoad] = useState(false);
  useEffect(() => {
    if (loaded) { setSlowLoad(false); return; }
    const t = setTimeout(() => setSlowLoad(true), 4000);
    return () => clearTimeout(t);
  }, [loaded]);

  if (!loaded) {
    return (
      <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: COLORS.ink, textAlign: "center" }}>
          <div style={{
            width: 32, height: 32, border: `3px solid ${COLORS.rule}`, borderTopColor: COLORS.accentDark,
            borderRadius: "50%", margin: "0 auto 14px", animation: "spin 0.8s linear infinite",
          }} />
          <div>Ouverture du garde-manger…</div>
          {slowLoad && (
            <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 8, maxWidth: 240 }}>
              Le serveur met parfois quelques secondes de plus à répondre — ça s'en vient.
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #D8D2BE; border-radius: 3px; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .hand { font-family: 'Caveat', cursive; }
        button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
          outline: 2px solid ${COLORS.accentDark}; outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>

      <header style={{ padding: "20px 18px 0", maxWidth: 760, margin: "0 auto" }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 1.5, color: COLORS.muted, textTransform: "uppercase" }}>
          Épicerie · repas · idées de soupers
        </div>
        <h1 className="hand" onClick={handleTitleTap} style={{ margin: "2px 0 16px", fontSize: 38, color: COLORS.ink, fontWeight: 700, cursor: isKidLocked ? "default" : "auto", userSelect: "none" }}>
          Épicerie & Repas
        </h1>
      </header>

      <nav style={{ maxWidth: 760, margin: "0 auto", padding: "0 18px" }}>
        <div style={{ display: "flex", gap: 4, borderBottom: "3px solid #D8D2BE", overflowX: "auto" }}>
          {(isKidLocked ? [{ id: "moi", label: myMember?.name || "Moi", icon: Sparkles }] : [
            ...(myMember ? [{ id: "moi", label: "Moi", icon: Sparkles }] : []),
            { id: "semaine", label: "Semaine", icon: CalendarDays },
            { id: "epicerie", label: "Épicerie", icon: ShoppingCart },
            { id: "idees", label: "Idées", icon: ChefHat },
            { id: "taches", label: "Tâches", icon: ListTodo },
            { id: "params", label: "Paramètres", icon: Settings },
          ]).map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: "1 0 auto", minWidth: 64, padding: "10px 4px 12px", border: "none", cursor: "pointer",
                background: active ? COLORS.card : "transparent",
                color: active ? COLORS.ink : COLORS.muted,
                fontWeight: 600, fontSize: 12.5, fontFamily: "'IBM Plex Sans', sans-serif",
                borderRadius: "8px 8px 0 0",
                borderTop: active ? `3px solid ${COLORS.accent}` : "3px solid transparent",
                marginBottom: -3,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                transform: active ? "translateY(-2px)" : "none",
                boxShadow: active ? "0 -2px 6px rgba(0,0,0,0.08)" : "none",
              }}>
                <Icon size={16} strokeWidth={2.2} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "20px 18px 100px" }}>
        {tab === "moi" && myMember && (
          <MoiView member={myMember} tasks={tasks} rewardCharts={rewardCharts}
            onToggleRoutineStep={toggleRoutineStep} onMarkNight={markRewardNight} onUndoNight={undoRewardNight}
            onSetReward={setRewardChoice} />
        )}
        {tab === "semaine" && (
          <Semaine weekDates={weekDates} weekPlan={weekPlan} mealById={mealById}
            onPrevWeek={() => setWeekStart(addDays(weekStart, -7))}
            onNextWeek={() => setWeekStart(addDays(weekStart, 7))}
            onToday={() => setWeekStart(startOfWeek(todayStr()))}
            onPick={setPickingDay} onClear={clearDayPlan}
            onAddIngredients={addIngredientsToGrocery} />
        )}
        {tab === "epicerie" && (
          <Epicerie items={groceryItems} settings={settings} onAdd={() => setShowAddItem(true)} onToggle={toggleGroceryItem}
            onDelete={deleteGroceryItem} onClearChecked={clearChecked} onReset={resetGroceryList} />
        )}
        {tab === "idees" && (
          <Idees meals={mealIdeas} onAdd={() => setShowAddMeal(true)} onAddMarinades={addMarinades} onAddSnacks={addSnacks} onAddPickyLunches={addPickyLunches} onAddSideDishes={addSideDishes} onAddMoreMarinades={addMoreMarinades} onEdit={setEditingMeal} onDelete={deleteMeal} />
        )}
        {tab === "taches" && (
          <Taches members={members} tasks={tasks} onAddMember={() => setShowAddMember(true)} onDeleteMember={deleteMember}
            onEditMember={setEditingMember} myMemberId={myMemberId}
            onAddTask={() => setShowAddTask(true)} onEditTask={setEditingTask} onDeleteTask={deleteTask}
            onToggleTask={toggleTaskDone} onRotateTask={rotateTask} onCoverAbsence={coverAbsence} onToggleRoutineStep={toggleRoutineStep}
            rewardCharts={rewardCharts} onAddReward={() => setShowAddReward(true)} onEditReward={setEditingReward}
            onDeleteReward={deleteRewardChart} onMarkNight={markRewardNight} onUndoNight={undoRewardNight} onSetReward={setRewardChoice} />
        )}
        {tab === "params" && (
          <Params settings={settings} onSave={persistSettings} onRefresh={loadAll} onForcePush={forcePushAll} itemsCount={groceryItems.length} mealsCount={mealIdeas.length} members={members} myMemberId={myMemberId} setMyMemberId={setMyMemberId} onExport={exportBackup} onImport={importBackup} session={session} />
        )}
      </main>

      {saveErr && (
        <div style={{ position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)",
          background: COLORS.danger, color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 12.5,
          fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
          <AlertCircle size={14} /> Synchronisation échouée — vos données restent sur cet appareil.
        </div>
      )}

      {showAddItem && (
        <ItemModal onClose={() => setShowAddItem(false)} onSave={(item) => { addGroceryItem(item); setShowAddItem(false); }} />
      )}
      {(showAddMeal || editingMeal) && (
        <MealModal meal={editingMeal} onClose={() => { setShowAddMeal(false); setEditingMeal(null); }}
          onSave={(m) => { if (editingMeal) updateMeal(editingMeal.id, m); else addMeal(m); setShowAddMeal(false); setEditingMeal(null); }} />
      )}
      {pickingDay && (
        <PickMealModal date={pickingDay} meals={mealIdeas} weekDates={weekDates} weekPlan={weekPlan}
          onClose={() => setPickingDay(null)}
          onPick={(patch) => { setDayPlan(pickingDay, patch); setPickingDay(null); }} />
      )}
      {(showAddMember || editingMember) && (
        <MemberModal member={editingMember} onClose={() => { setShowAddMember(false); setEditingMember(null); }}
          onSave={(patch) => {
            if (editingMember) updateMember(editingMember.id, patch);
            else addMember(patch.name, patch.phone, patch.kidMode);
            setShowAddMember(false); setEditingMember(null);
          }} />
      )}
      {(showAddTask || editingTask) && (
        <TaskModal members={members} task={editingTask} rewardCharts={rewardCharts} onClose={() => { setShowAddTask(false); setEditingTask(null); }}
          onSave={(t) => { if (editingTask) updateTask(editingTask.id, t); else addTask(t); setShowAddTask(false); setEditingTask(null); }} />
      )}
      {(showAddReward || editingReward) && (
        <RewardChartModal members={members} chart={editingReward} onClose={() => { setShowAddReward(false); setEditingReward(null); }}
          onSave={(c) => { if (editingReward) updateRewardChart(editingReward.id, c); else addRewardChart(c); setShowAddReward(false); setEditingReward(null); }} />
      )}
    </div>
  );
}

const pageStyle = { minHeight: "100vh", background: COLORS.paper, fontFamily: "'IBM Plex Sans', sans-serif", color: COLORS.ink };
const primaryBtn = { background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Sans', sans-serif" };
const outlineBtn = { background: "#fff", color: COLORS.accentDark, border: `1.5px solid ${COLORS.accentDark}`, borderRadius: 8, padding: "9px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Sans', sans-serif" };

function EmptyState({ text, cta, onClick }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", background: COLORS.card, borderRadius: 10, border: "1.5px dashed #D8D2BE" }}>
      <p style={{ color: COLORS.muted, marginBottom: 14, fontSize: 14.5 }}>{text}</p>
      {cta && <button onClick={onClick} style={primaryBtn}><Plus size={16} /> {cta}</button>}
    </div>
  );
}

function PinCard({ children: c }) {
  return (
    <div style={{ position: "relative", background: COLORS.card, borderRadius: 4, padding: "18px 14px 14px", marginBottom: 14, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
      <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", width: 16, height: 16, borderRadius: "50%", background: "#B5715F", boxShadow: "0 2px 3px rgba(0,0,0,0.25)" }} />
      {c}
    </div>
  );
}

function Semaine({ weekDates, weekPlan, mealById, onPrevWeek, onNextWeek, onToday, onPick, onClear, onAddIngredients }) {
  const planFor = (date) => weekPlan.find(p => p.date === date);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={onPrevWeek} style={{ background: "#fff", border: "1.5px solid #D8D2BE", borderRadius: 8, padding: 8 }}><ChevronLeft size={16} color={COLORS.accentDark} /></button>
        <button onClick={onToday} className="hand" style={{ fontSize: 20, background: "none", border: "none", color: COLORS.ink, cursor: "pointer" }}>
          Semaine du {fmtDayLabel(weekDates[0]).split(" ").slice(1).join(" ")}
        </button>
        <button onClick={onNextWeek} style={{ background: "#fff", border: "1.5px solid #D8D2BE", borderRadius: 8, padding: 8 }}><ChevronRight size={16} color={COLORS.accentDark} /></button>
      </div>
      {weekDates.map(date => {
        const plan = planFor(date);
        const meal = plan?.mealIdeaId ? mealById(plan.mealIdeaId) : null;
        const title = meal?.title || plan?.customTitle;
        return (
          <div key={date} className="ledger-row" style={{ background: COLORS.card, borderRadius: 10, padding: "12px 14px", marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 11, color: COLORS.muted, textTransform: "capitalize" }}>{fmtDayLabel(date)}</div>
                {title
                  ? <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{title}</div>
                  : <div style={{ fontSize: 13.5, color: COLORS.muted, fontStyle: "italic", marginTop: 2 }}>Aucun repas choisi</div>}
                {meal?.tags?.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                    {meal.tags.map(t => <span key={t} style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 10, background: "#F0EAD8", color: COLORS.muted }}>{t}</span>)}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <button onClick={() => onPick(date)} style={{ ...outlineBtn, padding: "6px 10px", fontSize: 11.5 }}>
                  {title ? <Pencil size={12} /> : <Plus size={12} />} {title ? "Changer" : "Choisir"}
                </button>
                {meal?.ingredients?.length > 0 && (
                  <button onClick={() => onAddIngredients(meal)} style={{ ...outlineBtn, padding: "6px 10px", fontSize: 11.5 }}>
                    <ShoppingCart size={12} /> Épicerie
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Epicerie({ items, settings, onAdd, onToggle, onDelete, onClearChecked, onReset }) {
  const grouped = AISLES.map(a => ({ ...a, items: items.filter(i => i.aisle === a.id) })).filter(a => a.items.length > 0);
  const hasChecked = items.some(i => i.checked);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  const phones = [settings.phone1, settings.phone2, settings.phone3, settings.phone4].map(p => (p || "").trim()).filter(Boolean);
  const unchecked = items.filter(i => !i.checked);

  const sendList = async () => {
    if (!settings.backendUrl) { setSendMsg("❌ Configurez d'abord l'adresse du backend dans Paramètres."); return; }
    if (phones.length === 0) { setSendMsg("❌ Ajoutez au moins un numéro dans Paramètres."); return; }
    if (unchecked.length === 0) { setSendMsg("La liste est vide (ou tout est déjà coché)."); return; }
    setSending(true); setSendMsg("");
    try {
      const res = await fetch(`${cleanBackendUrl(settings.backendUrl)}/api/sms/send-list`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: unchecked, phones }),
      });
      const data = await res.json();
      setSendMsg(data.success ? `✅ Liste envoyée à ${phones.length} numéro(s).` : "❌ Échec de l'envoi.");
    } catch { setSendMsg("❌ Impossible de joindre le backend."); }
    setSending(false);
  };

  const handleReset = () => {
    if (items.length === 0) return;
    if (window.confirm("Vider complètement la liste d'épicerie pour repartir à zéro? Cette action ne peut pas être annulée.")) {
      onReset();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <button onClick={onAdd} style={primaryBtn}><Plus size={16} /> Ajouter un article</button>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {hasChecked && <button onClick={onClearChecked} style={outlineBtn}><Trash2 size={14} /> Effacer les cochés</button>}
          {items.length > 0 && <button onClick={handleReset} style={{ ...outlineBtn, borderColor: COLORS.danger, color: COLORS.danger }}><RefreshCw size={14} /> Réinitialiser la liste</button>}
          <button onClick={sendList} style={outlineBtn} disabled={sending}>
            <Send size={14} /> {sending ? "Envoi…" : "Envoyer par SMS"}
          </button>
        </div>
      </div>
      {sendMsg && <p style={{ fontSize: 12.5, color: COLORS.muted, marginBottom: 14 }}>{sendMsg}</p>}
      {items.length === 0 && <EmptyState text="Liste vide. Ajoutez un article, ou glissez des ingrédients depuis l'onglet Semaine." />}
      {grouped.map(g => (
        <div key={g.id} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: g.color }} />
            <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{g.name}</span>
          </div>
          {g.items.map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: COLORS.card, borderRadius: 8, marginBottom: 4, opacity: item.checked ? 0.55 : 1 }}>
              <button onClick={() => onToggle(item.id)} style={{
                width: 20, height: 20, borderRadius: 5, border: `2px solid ${item.checked ? COLORS.accent : "#C7C2AE"}`,
                background: item.checked ? COLORS.accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer",
              }}>
                {item.checked && <Check size={13} color="#fff" strokeWidth={3} />}
              </button>
              <span style={{ flex: 1, fontSize: 14, textDecoration: item.checked ? "line-through" : "none" }}>{item.name}</span>
              {item.quantity && <span className="mono" style={{ fontSize: 12.5, color: COLORS.muted }}>{item.quantity}</span>}
              <button onClick={() => onDelete(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, padding: 2 }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Idees({ meals, onAdd, onAddMarinades, onAddSnacks, onAddPickyLunches, onAddSideDishes, onAddMoreMarinades, onEdit, onDelete }) {
  const [catFilter, setCatFilter] = useState("tous");
  const [tagFilter, setTagFilter] = useState("tous");
  const allTags = useMemo(() => Array.from(new Set(meals.flatMap(m => m.tags || []))).sort(), [meals]);
  const filtered = meals.filter(m => (catFilter === "tous" || m.category === catFilter) && (tagFilter === "tous" || (m.tags || []).includes(tagFilter)));
  const hasMarinades = meals.some(m => m.category === "marinade");
  const hasSnacks = meals.some(m => m.category === "collation");
  const hasPickyLunches = meals.some(m => m.category === "lunch");
  const hasSideDishes = meals.some(m => m.category === "accompagnement");
  const existingTitlesLower = useMemo(() => new Set(meals.map(m => m.title.toLowerCase())), [meals]);
  const hasMoreMarinades = CHICKEN_BEEF_MARINADES.every(r => existingTitlesLower.has(r.title.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {!hasMarinades && <button onClick={onAddMarinades} style={outlineBtn}><Plus size={16} /> Ajouter des marinades</button>}
        {hasMarinades && !hasMoreMarinades && <button onClick={onAddMoreMarinades} style={outlineBtn}><Plus size={16} /> Plus de marinades (poulet, bœuf)</button>}
        {!hasSnacks && <button onClick={onAddSnacks} style={outlineBtn}><Plus size={16} /> Ajouter des collations</button>}
        {!hasPickyLunches && <button onClick={onAddPickyLunches} style={outlineBtn}><Plus size={16} /> Ajouter des lunchs (enfant difficile)</button>}
        {!hasSideDishes && <button onClick={onAddSideDishes} style={outlineBtn}><Plus size={16} /> Ajouter des accompagnements</button>}
        <button onClick={onAdd} style={primaryBtn}><Plus size={16} /> Nouvelle idée</button>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        {[["tous", "Tous"], ["souper", "Soupers"], ["accompagnement", "Accompagnements"], ["lunch", "Lunchs"], ["collation", "Collations"], ["marinade", "Marinades"], ["dessert", "Desserts"]].map(([key, label]) => (
          <button key={key} onClick={() => setCatFilter(key)} style={{
            padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${COLORS.accentDark}`,
            background: catFilter === key ? COLORS.accentDark : "transparent", color: catFilter === key ? "#fff" : COLORS.accentDark,
            fontWeight: 600, fontSize: 12.5, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setTagFilter("tous")} style={{
          padding: "5px 10px", borderRadius: 20, border: "1px solid #D8D2BE",
          background: tagFilter === "tous" ? "#F0EAD8" : "#fff", color: COLORS.muted, fontSize: 11.5, cursor: "pointer",
        }}>Toutes étiquettes</button>
        {allTags.map(t => (
          <button key={t} onClick={() => setTagFilter(t)} style={{
            padding: "5px 10px", borderRadius: 20, border: "1px solid #D8D2BE",
            background: tagFilter === t ? "#F0EAD8" : "#fff", color: COLORS.muted, fontSize: 11.5, cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState text="Aucune idée pour ces filtres." />}
      {filtered.map(m => (
        <RecipeCard key={m.id} meal={m} onEdit={() => onEdit(m)} onDelete={() => onDelete(m.id)} />
      ))}
    </div>
  );
}

function RecipeCard({ meal: m, onEdit, onDelete }) {
  const [showSteps, setShowSteps] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  return (
    <PinCard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hand" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>{m.title}</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6, marginBottom: 8 }}>
            {(m.tags || []).map(t => <span key={t} style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 10, background: "#F0EAD8", color: COLORS.muted }}>{t}</span>)}
          </div>
          {m.ingredients?.length > 0 && (
            <>
              <div className="mono" style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Pour 6 personnes</div>
              <div style={{ fontSize: 12.5, color: COLORS.muted }}>
                {m.ingredients.map((i, idx) => (
                  <span key={idx}>{i.name}{i.quantity ? ` (${i.quantity})` : ""}{idx < m.ingredients.length - 1 ? " · " : ""}</span>
                ))}
              </div>
            </>
          )}
          {m.notes && <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 4, fontStyle: "italic" }}>{m.notes}</div>}
          {m.photo && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setShowPhoto(s => !s)} style={{
                background: "none", border: "none", cursor: "pointer", color: COLORS.accentDark,
                fontSize: 12.5, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 4, marginBottom: 8,
              }}>
                {m.photo.startsWith("data:application/pdf") ? <FileText size={13} /> : <Camera size={13} />}
                {showPhoto ? "Cacher la photo" : "Voir la photo de la recette"}
              </button>
              {showPhoto && (
                m.photo.startsWith("data:application/pdf") ? (
                  <a href={m.photo} download={m.fileName || `${m.title}.pdf`} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                    background: "#fff", border: "1.5px solid #D8D2BE", borderRadius: 8, textDecoration: "none",
                  }}>
                    <FileText size={16} color={COLORS.muted} />
                    <span style={{ fontSize: 12.5, color: COLORS.muted }}>{m.fileName || "Voir le PDF"}</span>
                  </a>
                ) : (
                  <img src={m.photo} alt={m.title} style={{ maxWidth: "100%", borderRadius: 8, display: "block" }} />
                )
              )}
            </div>
          )}
          {m.steps?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setShowSteps(s => !s)} style={{
                background: "none", border: "none", cursor: "pointer", color: COLORS.accentDark,
                fontSize: 12.5, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 4,
              }}>
                <ChefHat size={13} /> {showSteps ? "Cacher la recette" : "Voir la recette"}
              </button>
              {showSteps && (
                <ol style={{ margin: "8px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
                  {m.steps.map((step, i) => (
                    <li key={i} style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.4 }}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted, padding: 2 }}><Pencil size={15} /></button>
          <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, padding: 2 }}><Trash2 size={15} /></button>
        </div>
      </div>
    </PinCard>
  );
}

function MemberAvatar({ member, size = 32 }) {
  const initials = member.name.slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: member.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
      fontFamily: "'IBM Plex Sans', sans-serif",
    }}>{initials}</div>
  );
}

function Taches({ members, tasks, onAddMember, onDeleteMember, onEditMember, myMemberId, onAddTask, onEditTask, onDeleteTask, onToggleTask, onRotateTask, onCoverAbsence, onToggleRoutineStep, rewardCharts, onAddReward, onEditReward, onDeleteReward, onMarkNight, onUndoNight, onSetReward }) {
  const [coveringFor, setCoveringFor] = useState(null); // id de la tâche pour laquelle on choisit qui a couvert
  const [filter, setFilter] = useState(myMemberId || "all");
  const memberById = (id) => members.find(m => m.id === id);
  const filtered = tasks.filter(t => {
    if (filter === "all") return true;
    if (filter === "unassigned") return !t.assignedTo && !(t.rotation && t.rotation.length);
    if (t.rotation && t.rotation.length) return t.rotation.includes(filter);
    return t.assignedTo === filter;
  });

  // Séparation claire entre les routines visuelles (pour un jeune enfant, affichées
  // en grille d'images) et les tâches normales (corvées, pour les plus grands —
  // affichées en liste comme avant). C'est la catégorie qui différencie les deux,
  // pas la personne : une routine reste une routine peu importe qui la fait.
  const routines = filtered.filter(t => t.type === "routine");
  const chores = filtered.filter(t => t.type !== "routine");
  const active = chores.filter(t => !isTaskDone(t));
  const done = chores.filter(t => isTaskDone(t));

  const renderTask = (t) => {
    const isRotation = t.rotation && t.rotation.length > 0;
    const currentTurnMember = isRotation ? memberById(t.rotation[t.rotationIndex % t.rotation.length]) : null;
    const m = isRotation ? currentTurnMember : memberById(t.assignedTo);
    const complete = isTaskDone(t);
    const debtOwed = (t.makeupDebt || {})[currentTurnMember?.id] || 0;
    return (
      <div key={t.id} style={{ marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: COLORS.card, borderRadius: 8, opacity: complete ? 0.55 : 1 }}>
          <button onClick={() => isRotation ? onRotateTask(t) : onToggleTask(t)} style={{
            width: 22, height: 22, borderRadius: 6, border: `2px solid ${complete ? COLORS.accent : "#C7C2AE"}`,
            background: complete ? COLORS.accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer",
          }} title={isRotation ? "Fait — passer le tour" : undefined}>{complete && <Check size={14} color="#fff" strokeWidth={3} />}</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, textDecoration: complete ? "line-through" : "none" }}>{t.title}</div>
            {isRotation ? (
              <>
                <div style={{ fontSize: 11.5, color: COLORS.muted }}>
                  En alternance ({t.rotation.map(id => memberById(id)?.name).filter(Boolean).join(" → ")}) · Tour de {currentTurnMember?.name || "?"}{debtOwed > 0 ? ` (doit ${debtOwed} tour${debtOwed > 1 ? "s" : ""} de rattrapage)` : ""}{t.rotationAuto ? ` · change ${t.rotationAuto === "quotidien" ? "chaque jour" : t.rotationAuto === "hebdomadaire" ? "chaque semaine" : "aux 2 semaines"}${t.rotationAuto === "hebdomadaire" && Number.isInteger(t.rotationDayOfWeek) ? ` (${DAY_NAMES[t.rotationDayOfWeek]})` : ""}` : ""}
                </div>
                {t.completions && Object.keys(t.completions).length > 0 && (
                  <div className="mono" style={{ fontSize: 10.5, color: COLORS.accentDark, marginTop: 2 }}>
                    {t.rotation.map(id => memberById(id)).filter(Boolean).map(mem => `${mem.name} : ${t.completions[mem.id] || 0}`).join("  ·  ")}
                  </div>
                )}
                {!complete && (
                  <button onClick={() => setCoveringFor(coveringFor === t.id ? null : t.id)} style={{
                    background: "none", border: "none", cursor: "pointer", color: COLORS.accentDark, fontSize: 11, fontWeight: 600, padding: 0, marginTop: 4,
                  }}>
                    {currentTurnMember?.name} est absente — quelqu'un d'autre l'a fait?
                  </button>
                )}
              </>
            ) : (
              <div style={{ fontSize: 11.5, color: COLORS.muted }}>{TASK_FREQUENCIES[t.frequency]}{(t.frequency === "hebdomadaire" || t.frequency === "auxDeuxSemaines") && Number.isInteger(t.dueDayOfWeek) ? ` · ${DAY_NAMES[t.dueDayOfWeek]}` : ""}{t.dueDate ? ` · ${fmtDayLabel(t.dueDate)}` : ""}</div>
            )}
          </div>
          {m && <MemberAvatar member={m} size={26} />}
          <button onClick={() => onEditTask(t)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted, padding: 2 }}><Pencil size={14} /></button>
          <button onClick={() => onDeleteTask(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, padding: 2 }}><Trash2 size={14} /></button>
        </div>
        {coveringFor === t.id && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px", background: "#F0EAD8", borderRadius: 8, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: COLORS.muted, width: "100%" }}>Qui a fait la tâche à sa place?</span>
            {t.rotation.filter(id => id !== currentTurnMember?.id).map(id => {
              const mem = memberById(id);
              if (!mem) return null;
              return (
                <button key={id} onClick={() => { onCoverAbsence(t, id); setCoveringFor(null); }} style={{
                  padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${mem.color}`, background: mem.color, color: "#fff", fontWeight: 600, fontSize: 12.5, cursor: "pointer",
                }}>{mem.name}</button>
              );
            })}
            {members.filter(mem => !t.rotation.includes(mem.id)).map(mem => (
              <button key={mem.id} onClick={() => { onCoverAbsence(t, mem.id); setCoveringFor(null); }} style={{
                padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${mem.color}`, background: "transparent", color: mem.color, fontWeight: 600, fontSize: 12.5, cursor: "pointer",
              }}>{mem.name}</button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onAddMember} style={outlineBtn}><UserPlus size={14} /> Membre</button>
          <button onClick={onAddReward} style={outlineBtn}><Sparkles size={14} /> Défi récompense</button>
          <button onClick={onAddTask} style={primaryBtn}><Plus size={16} /> Nouvelle tâche</button>
        </div>
      </div>

      {members.length > 0 && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
          <button onClick={() => setFilter("all")} style={{
            padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${COLORS.accentDark}`,
            background: filter === "all" ? COLORS.accentDark : "transparent", color: filter === "all" ? "#fff" : COLORS.accentDark,
            fontWeight: 600, fontSize: 12.5, cursor: "pointer",
          }}>Tous</button>
          {members.map(m => (
            <button key={m.id} onClick={() => setFilter(m.id)} style={{
              padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${m.color}`,
              background: filter === m.id ? m.color : "transparent", color: filter === m.id ? "#fff" : m.color,
              fontWeight: 600, fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
            }}>{m.name}
              <span onClick={(e) => { e.stopPropagation(); onEditMember(m); }} style={{ opacity: 0.7, display: "flex" }}><Pencil size={11} /></span>
              <span onClick={(e) => { e.stopPropagation(); onDeleteMember(m.id); }} style={{ opacity: 0.7, display: "flex" }}><X size={11} /></span>
            </button>
          ))}
        </div>
      )}

      {members.length === 0 && (
        <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 14 }}>Ajoutez d'abord vos enfants comme membres pour pouvoir leur assigner des tâches.</p>
      )}

      {tasks.length === 0 && rewardCharts.length === 0 && <EmptyState text="Aucune tâche. Ajoutez la première corvée à faire, une routine visuelle, ou un défi récompense." />}

      {rewardCharts.filter(c => filter === "all" || c.memberId === filter).length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", marginBottom: 8 }}>Défis récompense</div>
          {rewardCharts.filter(c => filter === "all" || c.memberId === filter).map(c => (
            <RewardChartCard key={c.id} chart={c} member={memberById(c.memberId)}
              onMarkNight={() => onMarkNight(c)} onUndoNight={() => onUndoNight(c)}
              onEdit={() => onEditReward(c)} onDelete={() => onDeleteReward(c.id)} onSetReward={onSetReward} />
          ))}
        </div>
      )}

      {routines.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", marginBottom: 8 }}>Routines</div>
          {routines.map(t => (
            <RoutineGrid key={t.id} task={t} member={memberById(t.assignedTo)}
              onToggleStep={(stepId) => onToggleRoutineStep(t, stepId)}
              onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} />
          ))}
        </div>
      )}

      {chores.length > 0 && (
        <>
          <div className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", marginBottom: 6 }}>Tâches</div>
          {active.length > 0 && active.map(renderTask)}
          {active.length === 0 && <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 10 }}>Tout est fait 🎉</p>}
          {done.length > 0 && <>
            <div className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", margin: "16px 0 6px" }}>Fait</div>
            {done.map(renderTask)}
          </>}
        </>
      )}
    </div>
  );
}

// Routine visuelle pour un jeune enfant : chaque étape s'affiche comme une grande
// case tappable avec un émoji, plutôt qu'une ligne de texte — pensé pour un enfant
// qui ne lit pas encore couramment.
// Célébration plein écran (ballons + confettis + feux d'artifice) — impossible à
// manquer, pensée pour un enfant qui ne remarque pas un simple message de texte
// quand il termine sa routine.
function Celebration() {
  const particles = useMemo(() => {
    const emojis = ["🎈", "🎉", "✨", "🎊", "⭐", "🎆"];
    return Array.from({ length: 26 }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.2,
      size: 28 + Math.random() * 26,
      drift: (Math.random() - 0.5) * 60,
    }));
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      {particles.map(p => (
        <span key={p.id} style={{
          position: "absolute", left: `${p.left}%`, bottom: "-10%", fontSize: p.size,
          animation: `celebrationRise ${p.duration}s ease-in ${p.delay}s forwards`,
          "--drift": `${p.drift}px`,
        }}>{p.emoji}</span>
      ))}
      <div style={{
        background: "rgba(43, 74, 71, 0.92)", color: "#fff", padding: "22px 34px", borderRadius: 20,
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800, textAlign: "center",
        animation: "celebrationPop 0.5s ease-out", boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
      }}>
        🎉 Bravo! 🎉<br /><span style={{ fontSize: 16, fontWeight: 600 }}>Routine terminée!</span>
      </div>
      <style>{`
        @keyframes celebrationRise {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-115vh) translateX(var(--drift)) rotate(360deg); opacity: 0; }
        }
        @keyframes celebrationPop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Invitation plein écran "c'est l'heure!" — s'affiche dès l'ouverture de l'app si
// une routine due n'est pas encore faite. Une vraie notification reste limitée à
// du texte (une contrainte d'iOS, pas contournable), mais ceci prend le relais dès
// que l'enfant ouvre l'app — impossible à manquer, contrairement à une petite
// bannière de notification.
function RoutineReminderPrompt({ routineTitles, onDismiss }) {
  const particles = useMemo(() => {
    const emojis = ["🎈", "🎆", "✨", "🎉"];
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 2.4 + Math.random() * 1.6,
      size: 26 + Math.random() * 24,
      drift: (Math.random() - 0.5) * 70,
    }));
  }, []);

  return (
    <div onClick={onDismiss} style={{
      position: "fixed", inset: 0, zIndex: 9999, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      background: "rgba(178, 138, 58, 0.15)",
    }}>
      {particles.map(p => (
        <span key={p.id} style={{
          position: "absolute", left: `${p.left}%`, bottom: "-10%", fontSize: p.size,
          animation: `celebrationRise ${p.duration}s ease-in ${p.delay}s infinite`,
          "--drift": `${p.drift}px`,
        }}>{p.emoji}</span>
      ))}
      <div style={{
        background: "rgba(178, 106, 42, 0.95)", color: "#fff", padding: "26px 30px", borderRadius: 20,
        fontFamily: "'Space Grotesk', sans-serif", textAlign: "center", maxWidth: 320,
        animation: "celebrationPop 0.5s ease-out", boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
      }}>
        <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>🎈 C'est l'heure! 🎈</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
          {routineTitles.map(t => `"${t}"`).join(" · ")}
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 12px" }}>
          Touche l'écran pour commencer!
        </div>
      </div>
    </div>
  );
}

function RoutineGrid({ task, member, onToggleStep, onEdit, onDelete, hideActions }) {
  const checkedToday = (task.checkedSteps && task.checkedSteps[todayStr()]) || [];
  const allDone = isRoutineDoneToday(task);
  const [celebrating, setCelebrating] = useState(false);
  const prevAllDoneRef = useRef(allDone);
  // Empêche qu'un appui impatient répété (avant que l'écran ait le temps de se
  // mettre à jour) ne fasse basculer une étape cochée ↔ décochée plusieurs fois de
  // suite — chaque étape se bloque brièvement juste après avoir été touchée.
  const [lockedSteps, setLockedSteps] = useState(new Set());
  const handleToggleStep = (stepId) => {
    if (lockedSteps.has(stepId)) return;
    setLockedSteps(prev => new Set(prev).add(stepId));
    onToggleStep(stepId);
    setTimeout(() => setLockedSteps(prev => { const next = new Set(prev); next.delete(stepId); return next; }), 1200);
  };

  useEffect(() => {
    if (allDone && !prevAllDoneRef.current) {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 2600);
      prevAllDoneRef.current = allDone;
      return () => clearTimeout(t);
    }
    prevAllDoneRef.current = allDone;
  }, [allDone]);

  return (
    <div style={{ background: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 12, border: `1.5px solid ${member?.color || "#D8D2BE"}` }}>
      {celebrating && <Celebration />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {member && <MemberAvatar member={member} size={28} />}
          <span className="hand" style={{ fontSize: hideActions ? 23 : 19, fontWeight: 700 }}>{task.title}</span>
          {task.linkedRewardChartId && <span title="Liée à un défi récompense" style={{ fontSize: 15 }}>⭐</span>}
        </div>
        {!hideActions && (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={onEdit} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted, padding: 4 }}><Pencil size={14} /></button>
            <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, padding: 4 }}><Trash2 size={14} /></button>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: hideActions ? "repeat(auto-fill, minmax(110px, 1fr))" : "repeat(auto-fill, minmax(84px, 1fr))", gap: 8 }}>
        {(task.steps || []).map(step => {
          const checked = checkedToday.includes(step.id);
          const locked = lockedSteps.has(step.id);
          return (
            <button key={step.id} onClick={() => handleToggleStep(step.id)} disabled={locked} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
              padding: "12px 6px", borderRadius: 12, border: `2px solid ${checked ? COLORS.accent : "#D8D2BE"}`,
              background: checked ? "#F0EAD8" : "#fff", cursor: locked ? "default" : "pointer", position: "relative", minHeight: 84,
              opacity: locked ? 0.7 : 1,
            }}>
              {checked && (
                <span style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </span>
              )}
              <span style={{ fontSize: 30, opacity: checked ? 1 : 0.85 }}>{step.emoji || "⭐"}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.ink, textAlign: "center", lineHeight: 1.2, textDecoration: checked ? "line-through" : "none" }}>{step.label}</span>
            </button>
          );
        })}
      </div>
      {allDone && (
        <div style={{ marginTop: 10, textAlign: "center", fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
          🎉 Routine terminée!
        </div>
      )}
    </div>
  );
}

// Calendrier de récompense évolutif — une rangée d'étoiles à remplir vers un
// objectif (ex. 5 dodos dans sa chambre). Une fois l'objectif atteint, il
// recommence à zéro avec un objectif plus grand (goal + increment), pour que le
// défi évolue avec l'enfant plutôt que de rester figé.
// Page "Moi" : ce qu'un enfant identifié voit en ouvrant l'app, ou en touchant
// une notification — seulement ses routines et ses défis récompense, en grand,
// sans onglets ni réglages autour.
function MoiView({ member, tasks, rewardCharts, onToggleRoutineStep, onMarkNight, onUndoNight, onSetReward }) {
  const myRoutines = tasks.filter(t => t.type === "routine" && t.assignedTo === member.id);
  const myCharts = rewardCharts.filter(c => c.memberId === member.id);

  // Routines dont l'heure de rappel est déjà passée aujourd'hui et qui ne sont pas
  // encore terminées — c'est pour celles-là qu'on affiche la grande invitation.
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const dueRoutines = myRoutines.filter(t => t.notifyTime && t.notifyTime <= currentTime && !isRoutineDoneToday(t));

  const [showReminder, setShowReminder] = useState(dueRoutines.length > 0);

  return (
    <div>
      {showReminder && dueRoutines.length > 0 && (
        <RoutineReminderPrompt routineTitles={dueRoutines.map(t => t.title)} onDismiss={() => setShowReminder(false)} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <MemberAvatar member={member} size={40} />
        <span className="hand" style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink }}>Salut {member.name}!</span>
      </div>

      {myRoutines.length === 0 && myCharts.length === 0 && (
        <EmptyState text="Rien pour l'instant — demande à un parent d'ajouter une routine ou un défi récompense." />
      )}

      {myRoutines.map(t => (
        <RoutineGrid key={t.id} task={t} member={member} onToggleStep={(stepId) => onToggleRoutineStep(t, stepId)} onEdit={() => {}} onDelete={() => {}} hideActions />
      ))}

      {myCharts.map(c => (
        <RewardChartCard key={c.id} chart={c} member={member} onMarkNight={() => onMarkNight(c)} onUndoNight={() => onUndoNight(c)}
          onEdit={() => {}} onDelete={() => {}} onSetReward={onSetReward} hideActions />
      ))}
    </div>
  );
}

function RewardChartCard({ chart, member, onMarkNight, onUndoNight, onEdit, onDelete, onSetReward, hideActions }) {
  const today = todayStr();
  const doneToday = chart.history.includes(today);
  const stars = Array.from({ length: chart.goal }, (_, i) => i < chart.progress);
  const [rewardText, setRewardText] = useState("");
  const [showCumulative, setShowCumulative] = useState(false);
  const rewards = chart.rewards || [];
  const cumulativeTotal = chart.history.length; // jamais remis à zéro, même après un palier
  const milestones = chart.cumulativeMilestones || [];

  return (
    <div style={{ background: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 12, border: `1.5px solid ${member?.color || "#D8D2BE"}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {member && <MemberAvatar member={member} size={28} />}
          <span className="hand" style={{ fontSize: 19, fontWeight: 700 }}>{chart.title}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {!hideActions && <>
            <button onClick={onEdit} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted, padding: 4 }}><Pencil size={14} /></button>
            <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, padding: 4 }}><Trash2 size={14} /></button>
          </>}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: COLORS.muted, marginBottom: 10 }}>
        Objectif actuel : {chart.goal} ⭐ {chart.milestonesReached > 0 ? `· ${chart.milestonesReached} palier${chart.milestonesReached > 1 ? "s" : ""} déjà atteint${chart.milestonesReached > 1 ? "s" : ""} 🌟` : ""}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {stars.map((filled, i) => (
          <span key={i} style={{ fontSize: 26, opacity: filled ? 1 : 0.25 }}>{filled ? "🌟" : "☆"}</span>
        ))}
      </div>

      {chart.awaitingReward && onSetReward && (
        <div style={{ background: "#F0EAD8", borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🎉 Palier atteint! Quelle récompense veux-tu?</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={rewardText} onChange={e => setRewardText(e.target.value)} placeholder="Ex. Aller au parc, une soirée cinéma…"
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }} onKeyDown={e => { if (e.key === "Enter") { onSetReward(chart, rewardText); setRewardText(""); } }} />
            <button onClick={() => { onSetReward(chart, rewardText); setRewardText(""); }} style={outlineBtn}><Check size={16} /></button>
          </div>
          <button onClick={() => onSetReward(chart, "Non précisée")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted, fontSize: 11.5, padding: 0, textDecoration: "underline" }}>
            Décider plus tard — ne plus me le demander pour ce palier
          </button>
        </div>
      )}
      <button onClick={doneToday ? onUndoNight : onMarkNight} style={{
        width: "100%", padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer",
        background: doneToday ? "#F0EAD8" : COLORS.accent, color: doneToday ? COLORS.ink : "#fff",
        fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        {doneToday ? <>✓ Réussi aujourd'hui — toucher pour annuler</> : <>⭐ Marquer réussi aujourd'hui</>}
      </button>

      {rewards.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: COLORS.muted }}>
          🎁 Récompenses gagnées : {rewards.map(r => r.text).join(", ")}
        </div>
      )}

      {milestones.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setShowCumulative(s => !s)} style={{
            background: "none", border: "none", cursor: "pointer", color: COLORS.accentDark,
            fontSize: 12, fontWeight: 700, padding: 0, display: "flex", alignItems: "center", gap: 4,
          }}>
            🏆 Cumulatif : {cumulativeTotal} étoile{cumulativeTotal > 1 ? "s" : ""} au total — {showCumulative ? "cacher" : "voir"} les paliers
          </button>
          {showCumulative && (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
              <tbody>
                {[...milestones].sort((a, b) => a.threshold - b.threshold).map((m, i) => {
                  const reached = cumulativeTotal >= m.threshold;
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${COLORS.rule || "#D8D2BE"}` }}>
                      <td className="mono" style={{ padding: "6px 8px", fontSize: 12.5, fontWeight: 700, color: reached ? COLORS.accent : COLORS.muted, whiteSpace: "nowrap" }}>
                        {reached ? "✅" : "☆"} {m.threshold}
                      </td>
                      <td style={{ padding: "6px 8px", fontSize: 12.5, color: reached ? COLORS.ink : COLORS.muted }}>{m.reward}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function RewardChartModal({ members, chart, onClose, onSave }) {
  const [title, setTitle] = useState(chart?.title || "Dodo dans sa chambre");
  const [memberId, setMemberId] = useState(chart?.memberId || members[0]?.id || "");
  const [goal, setGoal] = useState(chart?.goal || 5);
  const [increment, setIncrement] = useState(chart?.increment ?? 2);
  const [milestones, setMilestones] = useState(chart?.cumulativeMilestones || []);
  const [newThreshold, setNewThreshold] = useState("");
  const [newReward, setNewReward] = useState("");
  const [history, setHistory] = useState(chart?.history || []);
  const [progress, setProgress] = useState(chart?.progress || 0);
  const [err, setErr] = useState("");

  const addMilestone = () => {
    if (!newThreshold || !newReward.trim()) return;
    setMilestones(prev => [...prev, { threshold: Number(newThreshold), reward: newReward.trim() }]);
    setNewThreshold(""); setNewReward("");
  };
  const removeMilestone = (i) => setMilestones(prev => prev.filter((_, idx) => idx !== i));

  // Retire une nuit précise de l'historique (pas juste celle d'aujourd'hui) — pour
  // corriger une étoile ajoutée par erreur il y a quelques jours. Le progrès actuel
  // descend d'un cran aussi, sans quoi le compte total resterait faux.
  const removeHistoryDate = (date) => {
    setHistory(prev => prev.filter(d => d !== date));
    setProgress(prev => Math.max(0, prev - 1));
  };
  const [addDate, setAddDate] = useState("");
  // Rajoute une étoile manquée (ex. perdue à cause d'un bug de synchronisation
  // avant un correctif) — pour une date qui ne serait pas déjà enregistrée.
  const addHistoryDate = () => {
    if (!addDate || history.includes(addDate)) return;
    setHistory(prev => [...prev, addDate]);
    setProgress(prev => prev + 1);
    setAddDate("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setErr("Le titre est requis."); return; }
    if (!memberId) { setErr("Choisissez un enfant."); return; }
    onSave({ title: title.trim(), memberId, goal: Number(goal) || 5, increment: Number(increment) || 0, cumulativeMilestones: milestones, history, progress: Number(progress) || 0 });
  };

  return (
    <ModalShell title={chart ? "Modifier le défi" : "Nouveau défi récompense"} onClose={onClose} onSubmit={submit}>
      <label style={labelStyle}>Titre du défi</label>
      <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex. Dodo dans sa chambre" autoFocus />
      <label style={labelStyle}>Pour qui</label>
      <select style={inputStyle} value={memberId} onChange={e => setMemberId(e.target.value)}>
        <option value="">Choisir…</option>
        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <label style={labelStyle}>Objectif de départ (nombre d'étoiles)</label>
      <input type="number" min="1" style={inputStyle} value={goal} onChange={e => setGoal(e.target.value)} />
      <label style={labelStyle}>Augmentation à chaque palier atteint</label>
      <input type="number" min="0" style={inputStyle} value={increment} onChange={e => setIncrement(e.target.value)} />
      <p style={{ fontSize: 12, color: COLORS.muted, marginTop: -6 }}>
        Ex. commencer à 5 étoiles, puis +2 à chaque fois : le prochain objectif sera 7, puis 9, puis 11…
      </p>

      {chart && (
        <>
          <label style={labelStyle}>Corriger une étoile ajoutée par erreur</label>
          <p style={{ fontSize: 12, color: COLORS.muted, marginTop: -6, marginBottom: 8 }}>
            Retirez une nuit précise (pas juste celle d'aujourd'hui) — le progrès et le total cumulatif s'ajustent automatiquement.
          </p>
          {history.length === 0 ? (
            <p style={{ fontSize: 12.5, color: COLORS.muted, marginBottom: 12 }}>Aucune nuit enregistrée pour l'instant.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12, maxHeight: 180, overflowY: "auto" }}>
              {[...history].sort((a, b) => b.localeCompare(a)).map(date => (
                <div key={date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#F0EAD8", borderRadius: 8 }}>
                  <span style={{ fontSize: 12.5 }}>{new Date(date + "T00:00:00").toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" })}</span>
                  <button type="button" onClick={() => removeHistoryDate(date)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, display: "flex" }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
            <button type="button" onClick={addHistoryDate} style={outlineBtn}><Plus size={16} /> Rajouter une étoile manquée</button>
          </div>
          <label style={labelStyle}>Progrès actuel (étoiles remplies vers l'objectif)</label>
          <input type="number" min="0" style={inputStyle} value={progress} onChange={e => setProgress(e.target.value)} />
          <p style={{ fontSize: 12, color: COLORS.muted, marginTop: -6, marginBottom: 14 }}>
            Ajusté automatiquement si vous retirez une nuit ci-dessus — modifiez seulement si un palier a été franchi par erreur et que l'objectif a déjà augmenté.
          </p>
        </>
      )}

      <label style={labelStyle}>Paliers cumulatifs (optionnel)</label>
      <p style={{ fontSize: 12, color: COLORS.muted, marginTop: -6, marginBottom: 10 }}>
        Un tableau à long terme qui compte le total d'étoiles jamais gagnées (ça n'est jamais remis à zéro) — ex. 50 étoiles cumulées débloque telle récompense, 75 une autre, et ainsi de suite.
      </p>
      {milestones.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          {[...milestones].sort((a, b) => a.threshold - b.threshold).map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#F0EAD8", borderRadius: 8 }}>
              <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, minWidth: 40 }}>{m.threshold} ⭐</span>
              <span style={{ fontSize: 12.5, flex: 1 }}>{m.reward}</span>
              <button type="button" onClick={() => removeMilestone(milestones.indexOf(m))} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, display: "flex" }}><X size={13} /></button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <input type="number" min="1" value={newThreshold} onChange={e => setNewThreshold(e.target.value)} placeholder="50" style={{ ...inputStyle, marginBottom: 0, width: 70 }} />
        <input value={newReward} onChange={e => setNewReward(e.target.value)} placeholder="Ex. Sortie au cinéma" style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMilestone(); } }} />
        <button type="button" onClick={addMilestone} style={outlineBtn}><Plus size={16} /></button>
      </div>

      {err && <p style={{ color: COLORS.danger, fontSize: 12.5, marginBottom: 10 }}>{err}</p>}
      <button type="submit" style={{ ...primaryBtn, width: "100%", justifyContent: "center", padding: "12px 16px" }}><Check size={16} /> Enregistrer</button>
    </ModalShell>
  );
}

function Card({ title, children: c }) {
  return (
    <div style={{ background: COLORS.card, borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
      <h3 className="hand" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>{title}</h3>
      {c}
    </div>
  );
}

function Params({ settings, onSave, onRefresh, onForcePush, itemsCount, mealsCount, members, myMemberId, setMyMemberId, onExport, onImport, session }) {
  const [form, setForm] = useState(settings);
  const [testResult, setTestResult] = useState("");
  const [syncResult, setSyncResult] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState("");
  const [pushStatus, setPushStatus] = useState("");
  const [pushBusy, setPushBusy] = useState(false);

  const enablePushForMember = async () => {
    if (!myMemberId) { setPushStatus("❌ Choisissez d'abord un membre."); return; }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) { setPushStatus("❌ Non supporté sur ce navigateur/appareil."); return; }
    setPushBusy(true); setPushStatus("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setPushStatus("❌ Permission refusée. Activez les notifications dans les réglages."); setPushBusy(false); return; }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const { data: keyData } = await supabase.functions.invoke("notify", { body: { action: "vapid-public-key" } });
      if (!keyData?.publicKey) { setPushStatus("❌ Les notifications ne sont pas encore configurées côté serveur."); setPushBusy(false); return; }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) });

      await supabase.functions.invoke("notify", { body: { action: "subscribe", memberId: myMemberId, subscription: sub } });
      const memberName = members.find(m => m.id === myMemberId)?.name;
      setPushStatus(`✅ Notifications activées sur cet appareil pour ${memberName}!`);
    } catch { setPushStatus("❌ Impossible d'activer les notifications sur cet appareil."); }
    setPushBusy(false);
  };

  const testPushForMember = async () => {
    if (!myMemberId) return;
    setPushStatus("Envoi du test…");
    try {
      const { data } = await supabase.functions.invoke("notify", { body: { action: "test", memberId: myMemberId } });
      setPushStatus(data?.success ? `✅ Notification de test envoyée (${data.pushSent} appareil(s)).` : "❌ Aucun appareil abonné pour ce membre, ou échec.");
    } catch { setPushStatus("❌ Impossible de joindre le serveur de notifications."); }
  };

  // Pour un appareil de parent : retire complètement cet appareil des notifications
  // push, peu importe sous quel enfant il aurait été abonné avant (ex. pendant un test).
  const markAsParentDevice = async () => {
    setPushBusy(true); setPushStatus("");
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await supabase.functions.invoke("notify", { body: { action: "unsubscribe", endpoint: sub.endpoint } });
            await sub.unsubscribe();
          }
        }
      }
      setMyMemberId("");
      setPushStatus("✅ Cet appareil est marqué comme celui d'un parent — plus aucune alerte d'enfant ne lui sera envoyée.");
    } catch {
      setPushStatus("⚠️ Le désabonnement a peut-être échoué. Vous pouvez aussi simplement enlever les notifications de l'app dans les réglages de votre téléphone.");
    }
    setPushBusy(false);
  };

  const testBackend = async () => {
    setTestResult("Test en cours…");
    try {
      const res = await fetch(`${cleanBackendUrl(form.backendUrl)}/api/test`);
      const data = await res.json();
      setTestResult(data.success ? "✅ Backend connecté avec succès!" : "❌ Réponse inattendue.");
    } catch { setTestResult("❌ Impossible de joindre le backend. Vérifiez l'adresse."); }
  };
  const forceSync = async () => {
    setSyncing(true); setSyncResult("");
    try {
      const res = await fetch(`${cleanBackendUrl(form.backendUrl)}/api/sync`);
      if (!res.ok) { setSyncResult(`❌ Erreur (code ${res.status}). Réessayez dans une minute.`); }
      else {
        const json = await res.json();
        if (json.success && json.data) { await onRefresh({ force: true }); setSyncResult(`✅ Connexion réussie. Le serveur a ${(json.data.groceryItems || []).length} article(s).`); }
        else setSyncResult("⚠️ Le serveur a répondu, mais sans données encore sauvegardées.");
      }
    } catch { setSyncResult("❌ Aucune connexion au backend. Vérifiez internet ou l'adresse."); }
    setSyncing(false);
  };

  const [reminderResult, setReminderResult] = useState("");
  const runRemindersNow = async () => {
    setReminderResult("Vérification en cours…");
    try {
      const res = await fetch(`${cleanBackendUrl(form.backendUrl)}/api/taches/relancer-maintenant`, { method: "POST" });
      const data = await res.json();
      setReminderResult(data.success ? "✅ Vérification exécutée — un texto a été envoyé à quiconque a une tâche en retard (max 1 par jour)." : "❌ Échec.");
    } catch { setReminderResult("❌ Impossible de joindre le backend."); }
  };

  return (
    <div>
      <Card title="Backend de synchronisation">
        <p style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 0, marginBottom: 12 }}>
          Utilisez la même adresse sur le téléphone de votre conjoint·e pour partager la liste et le plan de repas.
        </p>
        <label style={labelStyle}>Adresse du backend</label>
        <input style={inputStyle} value={form.backendUrl} onChange={e => setForm({ ...form, backendUrl: e.target.value })} placeholder="https://epicerie-repas-backend.onrender.com" />
        <button type="button" onClick={testBackend} style={outlineBtn}>Tester la connexion</button>
        {testResult && <p style={{ fontSize: 12.5, marginTop: 8, color: COLORS.ink }}>{testResult}</p>}
      </Card>

      <Card title="Numéros pour recevoir la liste par SMS">
        <p style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 0, marginBottom: 12 }}>
          Format international, ex. +15145551234. Le bouton "Envoyer par SMS" de l'onglet Épicerie texte la liste (articles non cochés) à tous les numéros remplis ci-dessous.
        </p>
        <label style={labelStyle}>Numéro 1</label>
        <input style={inputStyle} value={form.phone1 || ""} onChange={e => setForm({ ...form, phone1: e.target.value })} placeholder="+15145551234" />
        <label style={labelStyle}>Numéro 2</label>
        <input style={inputStyle} value={form.phone2 || ""} onChange={e => setForm({ ...form, phone2: e.target.value })} placeholder="+15145551234" />
        <label style={labelStyle}>Numéro 3</label>
        <input style={inputStyle} value={form.phone3 || ""} onChange={e => setForm({ ...form, phone3: e.target.value })} placeholder="+15145551234" />
        <label style={labelStyle}>Numéro 4</label>
        <input style={inputStyle} value={form.phone4 || ""} onChange={e => setForm({ ...form, phone4: e.target.value })} placeholder="+15145551234" />
      </Card>

      <Card title="Canal des alertes de tâches">
        <p style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 0, marginBottom: 12 }}>
          Comment vos enfants reçoivent-elles les alertes de tour de tâche et les relances?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["both", "SMS et notification"],
            ["push", "Notification seulement"],
            ["sms", "SMS seulement"],
          ].map(([key, label]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: (form.taskNotifyChannel || "both") === key ? "#F0EAD8" : "#fff", border: `1.5px solid ${(form.taskNotifyChannel || "both") === key ? COLORS.accentDark : "#D8D2BE"}`, borderRadius: 8, cursor: "pointer" }}>
              <input type="radio" name="taskNotifyChannel" checked={(form.taskNotifyChannel || "both") === key} onChange={() => setForm({ ...form, taskNotifyChannel: key })} />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card title="Notifications sur l'appareil, par enfant">
        <p style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 0, marginBottom: 12 }}>
          Chaque enfant doit se choisir elle-même dans la liste ci-dessous, sur son <strong>propre téléphone</strong> — ça sert à la fois pour les notifications et pour que l'onglet Tâches ne lui montre que ses propres tâches par défaut. Ce choix est propre à cet appareil et ne touche jamais aux autres.
        </p>
        {members.length === 0 ? (
          <p style={{ fontSize: 12.5, color: COLORS.muted }}>Ajoutez d'abord des membres dans l'onglet Tâches.</p>
        ) : (
          <>
            <label style={labelStyle}>Sur ce téléphone, je suis :</label>
            <select style={inputStyle} value={myMemberId} onChange={e => setMyMemberId(e.target.value)}>
              <option value="">— Personne en particulier (voir toutes les tâches) —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={enablePushForMember} style={outlineBtn} disabled={pushBusy}>
                <Bell size={14} /> {pushBusy ? "Activation…" : "Activer les notifications"}
              </button>
              <button type="button" onClick={testPushForMember} style={outlineBtn}>Envoyer un test</button>
            </div>
            {pushStatus && <p style={{ fontSize: 12.5, marginTop: 8, color: COLORS.ink }}>{pushStatus}</p>}
            <p style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 8, marginBottom: 0 }}>
              Ce choix s'enregistre tout de suite, pas besoin du bouton "Enregistrer les paramètres" plus bas. Sur iPhone, l'app doit d'abord être ajoutée à l'écran d'accueil pour que les notifications fonctionnent.
            </p>
          </>
        )}
      </Card>

      <Card title="Ceci est l'appareil d'un parent">
        <p style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 0, marginBottom: 12 }}>
          Si ce téléphone est le vôtre (pas celui d'un enfant) et que vous avez testé les notifications par erreur, touchez ce bouton pour être certain de ne plus jamais recevoir d'alertes de tâches destinées aux enfants — ça désabonne complètement cet appareil.
        </p>
        <button type="button" onClick={markAsParentDevice} style={outlineBtn} disabled={pushBusy}>
          {pushBusy ? "En cours…" : "Ceci est l'appareil d'un parent — retirer les alertes d'enfants"}
        </button>
      </Card>

      <Card title="Heures de classe">
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={form.schoolHoursEnabled !== false} onChange={e => setForm({ ...form, schoolHoursEnabled: e.target.checked })} />
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>Ne pas envoyer d'alerte de tâche pendant les heures de classe</span>
        </label>
        <p style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 0, marginBottom: 12 }}>
          Du lundi au vendredi seulement. Les alertes de tour de tâche sont mises en attente et partent automatiquement dès la sortie des classes. La liste d'épicerie n'est pas concernée.
        </p>
        {form.schoolHoursEnabled !== false && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Début des classes</label>
              <select style={inputStyle} value={form.schoolStartHour ?? 8} onChange={e => setForm({ ...form, schoolStartHour: Number(e.target.value) })}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}h00</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Fin des classes</label>
              <select style={inputStyle} value={form.schoolEndHour ?? 15} onChange={e => setForm({ ...form, schoolEndHour: Number(e.target.value) })}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}h00</option>)}
              </select>
            </div>
          </div>
        )}
      </Card>

      <Card title="Horaire des relances">
        <p style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 0, marginBottom: 12 }}>
          Pour une tâche (ou un tour) toujours pas faite. En semaine : trois moments fixes. La fin de semaine, sans heures de classe : plusieurs rappels espacés dans la journée.
        </p>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Semaine</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 90 }}>
            <label style={labelStyle}>Avant l'école</label>
            <select style={inputStyle} value={form.morningReminderHour ?? 7} onChange={e => setForm({ ...form, morningReminderHour: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}h00</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 90 }}>
            <label style={labelStyle}>Après l'école</label>
            <select style={inputStyle} value={form.afternoonReminderHour ?? 16} onChange={e => setForm({ ...form, afternoonReminderHour: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}h00</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 90 }}>
            <label style={labelStyle}>Soir</label>
            <select style={inputStyle} value={form.eveningReminderHour ?? 19} onChange={e => setForm({ ...form, eveningReminderHour: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}h00</option>)}
            </select>
          </div>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Fin de semaine</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>À partir de</label>
            <select style={inputStyle} value={form.weekendReminderStartHour ?? 8} onChange={e => setForm({ ...form, weekendReminderStartHour: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}h00</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Jusqu'à</label>
            <select style={inputStyle} value={form.weekendReminderEndHour ?? 20} onChange={e => setForm({ ...form, weekendReminderEndHour: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}h00</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Toutes les</label>
            <select style={inputStyle} value={form.weekendReminderIntervalHours ?? 2} onChange={e => setForm({ ...form, weekendReminderIntervalHours: Number(e.target.value) })}>
              {[1, 2, 3, 4].map(h => <option key={h} value={h}>{h}h</option>)}
            </select>
          </div>
        </div>
      </Card>

      <button type="button" onClick={() => onSave({ ...form, backendUrl: cleanBackendUrl(form.backendUrl) })} style={{ ...primaryBtn, width: "100%", justifyContent: "center", padding: "12px 16px", marginBottom: 16 }}>
        <Check size={16} /> Enregistrer les paramètres
      </button>
      <Card title="Synchronisation de cet appareil">
        <p style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 0 }}>
          Cet appareil a <strong>{itemsCount}</strong> article(s) d'épicerie et <strong>{mealsCount}</strong> idée(s) de repas en mémoire locale.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={forceSync} style={outlineBtn} disabled={syncing}>
            <RefreshCw size={14} /> {syncing ? "Synchronisation…" : "Recevoir du serveur"}
          </button>
          <button type="button" onClick={async () => { setPushing(true); const ok = await onForcePush(); setPushResult(ok ? "✅ Vos données ont été renvoyées au serveur." : "❌ Échec de l'envoi."); setPushing(false); }} style={outlineBtn} disabled={pushing}>
            <RefreshCw size={14} /> {pushing ? "Envoi…" : "Renvoyer mes données au serveur"}
          </button>
        </div>
        {syncResult && <p style={{ fontSize: 12.5, marginTop: 8, color: COLORS.ink }}>{syncResult}</p>}
        {pushResult && <p style={{ fontSize: 12.5, marginTop: 8, color: COLORS.ink }}>{pushResult}</p>}
        <p style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 8, marginBottom: 0 }}>
          "Recevoir du serveur" ramène ce qui est déjà en ligne sur cet appareil. "Renvoyer mes données" fait l'inverse — utile si le serveur a perdu ses données (ex. après une pause d'inactivité) et que cet appareil a encore les bonnes informations.
        </p>
      </Card>

      <Card title="Compte">
        <p style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 0, marginBottom: 12 }}>
          Connecté en tant que <strong>{session?.user?.email}</strong>
        </p>
        <button type="button" onClick={() => supabase.auth.signOut()} style={{ ...outlineBtn, borderColor: COLORS.danger, color: COLORS.danger }}>
          Se déconnecter
        </button>
      </Card>

      <Card title="Sauvegarde locale">
        <p style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 0, marginBottom: 12 }}>
          Un fichier de sauvegarde téléchargé sur cet appareil, indépendant du serveur — un filet de sécurité supplémentaire. Faites-en une de temps en temps, surtout après avoir bâti une routine ou un défi récompense.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={onExport} style={outlineBtn}><FileText size={14} /> Exporter une sauvegarde</button>
          <label style={{ ...outlineBtn, cursor: "pointer", display: "inline-flex" }}>
            <FileText size={14} /> Importer une sauvegarde
            <input type="file" accept="application/json" style={{ display: "none" }}
              onChange={async (e) => { const file = e.target.files?.[0]; if (file) await onImport(file); e.target.value = ""; }} />
          </label>
        </div>
        <p style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 8, marginBottom: 0 }}>
          Importer remplace toutes les données actuelles (cet appareil et le serveur) par celles du fichier — une confirmation est demandée avant.
        </p>
      </Card>

      <Card title="Relances des tâches en alternance">
        <p style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 0 }}>
          Un texto est envoyé automatiquement chaque jour (18h par défaut) à qui a une tâche en retard, jusqu'à 3 fois par tour.
        </p>
        <button type="button" onClick={runRemindersNow} style={outlineBtn}>Vérifier les relances maintenant</button>
        {reminderResult && <p style={{ fontSize: 12.5, marginTop: 8, color: COLORS.ink }}>{reminderResult}</p>}
      </Card>
    </div>
  );
}

function ModalShell({ title, onClose, children: c, onSubmit }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(43,42,34,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: COLORS.card, width: "100%", maxWidth: 760, borderRadius: "16px 16px 0 0", padding: "18px 18px 24px", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 className="hand" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted }}><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit}>{c}</form>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #D8D2BE", background: "#fff", fontSize: 14, fontFamily: "'IBM Plex Sans', sans-serif", marginBottom: 12 };
const labelStyle = { fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 5, display: "block" };

function ItemModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [aisle, setAisle] = useState("autres");
  const [err, setErr] = useState("");
  const submit = (e) => { e.preventDefault(); if (!name.trim()) { setErr("Le nom est requis."); return; } onSave({ name: name.trim(), quantity: quantity.trim(), aisle }); };
  return (
    <ModalShell title="Ajouter un article" onClose={onClose} onSubmit={submit}>
      <label style={labelStyle}>Article</label>
      <input style={inputStyle} value={name} onChange={e => { setName(e.target.value); if (aisle === "autres") setAisle(guessAisle(e.target.value)); }} placeholder="Ex. Lait, Pommes, Poulet…" autoFocus />
      <label style={labelStyle}>Quantité (optionnel)</label>
      <input style={inputStyle} value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Ex. 2 L, 1 sac" />
      <label style={labelStyle}>Rayon</label>
      <select style={inputStyle} value={aisle} onChange={e => setAisle(e.target.value)}>
        {AISLES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      {err && <p style={{ color: COLORS.danger, fontSize: 12.5, marginBottom: 10 }}>{err}</p>}
      <button type="submit" style={{ ...primaryBtn, width: "100%", justifyContent: "center", padding: "12px 16px" }}><Check size={16} /> Ajouter</button>
    </ModalShell>
  );
}

function MealModal({ meal, onClose, onSave }) {
  const [title, setTitle] = useState(meal?.title || "");
  const [category, setCategory] = useState(meal?.category || "souper");
  const [tagsStr, setTagsStr] = useState((meal?.tags || []).join(", "));
  const [ingredientsStr, setIngredientsStr] = useState((meal?.ingredients || []).map(i => typeof i === "string" ? i : i.name).join(", "));
  const [stepsStr, setStepsStr] = useState((meal?.steps || []).join("\n"));
  const [notes, setNotes] = useState(meal?.notes || "");
  const [photo, setPhoto] = useState(meal?.photo || null);
  const [fileName, setFileName] = useState(meal?.fileName || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr("");
    try {
      if (file.type === "application/pdf") {
        if (file.size > 4 * 1024 * 1024) { setErr("Ce PDF est trop volumineux (max ~4 Mo)."); setBusy(false); return; }
        const dataUrl = await readAsDataUrl(file);
        setPhoto(dataUrl); setFileName(file.name);
      } else {
        const dataUrl = await resizeImage(file);
        setPhoto(dataUrl); setFileName(file.name);
      }
    } catch { setErr("Impossible de traiter ce fichier."); }
    setBusy(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setErr("Le titre est requis."); return; }
    onSave({
      title: title.trim(), category,
      tags: tagsStr.split(",").map(s => s.trim()).filter(Boolean),
      ingredients: ingredientsStr.split(",").map(s => s.trim()).filter(Boolean).map(name => ({ name, quantity: "" })),
      steps: stepsStr.split("\n").map(s => s.trim()).filter(Boolean),
      notes: notes.trim(),
      photo, fileName,
    });
  };

  const isPdf = photo && photo.startsWith("data:application/pdf");

  return (
    <ModalShell title={meal ? "Modifier l'idée" : "Nouvelle idée de repas"} onClose={onClose} onSubmit={submit}>
      <label style={labelStyle}>Titre</label>
      <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex. Poulet au four et légumes" autoFocus />
      <label style={labelStyle}>Catégorie</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[["souper", "Souper"], ["accompagnement", "Accompagnement"], ["lunch", "Lunch"], ["collation", "Collation"], ["marinade", "Marinade"], ["dessert", "Dessert"]].map(([key, label]) => (
          <button type="button" key={key} onClick={() => setCategory(key)} style={{
            flex: "1 1 30%", padding: 10, borderRadius: 8, border: `1.5px solid ${category === key ? COLORS.accentDark : "#D8D2BE"}`,
            background: category === key ? COLORS.accentDark : "#fff", color: category === key ? "#fff" : COLORS.ink, fontWeight: 600, fontSize: 13,
          }}>{label}</button>
        ))}
      </div>
      <label style={labelStyle}>Étiquettes (séparées par virgules)</label>
      <input style={inputStyle} value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="Ex. rapide, poulet, four" />
      <label style={labelStyle}>Ingrédients (séparés par virgules)</label>
      <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={ingredientsStr} onChange={e => setIngredientsStr(e.target.value)} placeholder="Ex. poulet, brocoli, riz, sauce soya" />
      <label style={labelStyle}>Étapes de préparation (une par ligne, optionnel)</label>
      <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={stepsStr} onChange={e => setStepsStr(e.target.value)} placeholder={"Ex.\nCuire le riz selon les instructions.\nFaire dorer le poulet 6-8 min.\nMélanger le tout et servir."} />
      <label style={labelStyle}>Notes (optionnel)</label>
      <textarea style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} />

      <label style={labelStyle}>Photo de la recette ou PDF (optionnel)</label>
      <p style={{ fontSize: 12, color: COLORS.muted, marginTop: -6, marginBottom: 8 }}>
        Prenez une photo d'une recette de livre ou de magazine, ou téléversez un PDF — pas besoin de tout retaper.
      </p>
      <label style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        border: "1.5px dashed #D8D2BE", borderRadius: 8, padding: "16px", cursor: "pointer",
        color: COLORS.muted, fontSize: 13, marginBottom: 12, background: "#fff",
      }}>
        <Camera size={18} />
        {busy ? "Traitement…" : photo ? `Ajouté : ${fileName || "fichier"} — toucher pour changer` : "Prendre une photo ou choisir un fichier"}
        <input type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFile} style={{ display: "none" }} />
      </label>
      {photo && !isPdf && <img src={photo} alt="aperçu" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 12 }} />}
      {photo && isPdf && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#fff", border: "1.5px solid #D8D2BE", borderRadius: 8, marginBottom: 12 }}>
          <FileText size={18} color={COLORS.muted} />
          <span style={{ fontSize: 13, color: COLORS.muted }}>{fileName}</span>
        </div>
      )}
      {photo && (
        <button type="button" onClick={() => { setPhoto(null); setFileName(""); }} style={{ ...outlineBtn, marginBottom: 12 }}>
          <X size={14} /> Retirer le fichier
        </button>
      )}

      {err && <p style={{ color: COLORS.danger, fontSize: 12.5, marginBottom: 10 }}>{err}</p>}
      <button type="submit" style={{ ...primaryBtn, width: "100%", justifyContent: "center", padding: "12px 16px" }} disabled={busy}><Check size={16} /> Enregistrer</button>
    </ModalShell>
  );
}

function PickMealModal({ date, meals, weekDates, weekPlan, onClose, onPick }) {
  const [customTitle, setCustomTitle] = useState("");
  const usedIds = new Set(weekDates.map(d => weekPlan.find(p => p.date === d)?.mealIdeaId).filter(Boolean));
  const souperMeals = meals.filter(m => m.category === "souper");

  const suggestRandom = () => {
    const pool = souperMeals.filter(m => !usedIds.has(m.id));
    const list = pool.length ? pool : souperMeals;
    if (list.length === 0) return;
    const pick = list[Math.floor(Math.random() * list.length)];
    onPick({ mealIdeaId: pick.id, customTitle: null });
  };

  return (
    <ModalShell title={`Repas — ${fmtDayLabel(date)}`} onClose={onClose} onSubmit={(e) => e.preventDefault()}>
      <button type="button" onClick={suggestRandom} style={{ ...primaryBtn, width: "100%", justifyContent: "center", padding: "12px 16px", marginBottom: 16 }}>
        <Dice5 size={16} /> Suggestion aléatoire
      </button>
      <label style={labelStyle}>Ou choisir dans les idées</label>
      <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 14, border: "1.5px solid #D8D2BE", borderRadius: 8 }}>
        {souperMeals.map(m => (
          <button type="button" key={m.id} onClick={() => onPick({ mealIdeaId: m.id, customTitle: null })} style={{
            display: "block", width: "100%", textAlign: "left", padding: "10px 12px", background: "none", border: "none",
            borderBottom: "1px solid #EDE9DA", fontSize: 14, cursor: "pointer",
          }}>{m.title}</button>
        ))}
      </div>
      <label style={labelStyle}>Ou entrer un titre personnalisé</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input style={{ ...inputStyle, flex: 1 }} value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Ex. Restes d'hier" />
        <button type="button" onClick={() => customTitle.trim() && onPick({ mealIdeaId: null, customTitle: customTitle.trim() })} style={outlineBtn}>
          <Check size={14} />
        </button>
      </div>
    </ModalShell>
  );
}

function MemberModal({ member, onClose, onSave }) {
  const [name, setName] = useState(member?.name || "");
  const [phone, setPhone] = useState(member?.phone || "");
  const [kidMode, setKidMode] = useState(member?.kidMode || false);
  const [err, setErr] = useState("");
  const submit = (e) => { e.preventDefault(); if (!name.trim()) { setErr("Le prénom est requis."); return; } onSave({ name: name.trim(), phone: phone.trim(), kidMode }); };
  return (
    <ModalShell title={member ? "Modifier le membre" : "Ajouter un membre"} onClose={onClose} onSubmit={submit}>
      <label style={labelStyle}>Prénom</label>
      <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Prénom de l'enfant" autoFocus />
      <label style={labelStyle}>Numéro de cellulaire (optionnel)</label>
      <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+15145551234" />
      <p style={{ fontSize: 12, color: COLORS.muted, marginTop: -4, marginBottom: 14 }}>
        Si rempli, elle reçoit un texto dès que c'est son tour pour une tâche en alternance.
      </p>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "#F0EAD8", borderRadius: 8, marginBottom: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={kidMode} onChange={e => setKidMode(e.target.checked)} style={{ marginTop: 2 }} />
        <span>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>Accès restreint (vue simplifiée)</span>
          <span style={{ display: "block", fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
            Sur l'appareil de cet enfant, l'app ne montre que ses routines et ses défis récompense en grand — pas les Paramètres ni les autres onglets.
          </span>
        </span>
      </label>
      {err && <p style={{ color: COLORS.danger, fontSize: 12.5, marginBottom: 10 }}>{err}</p>}
      <button type="submit" style={{ ...primaryBtn, width: "100%", justifyContent: "center", padding: "12px 16px" }}><Check size={16} /> {member ? "Enregistrer" : "Ajouter"}</button>
    </ModalShell>
  );
}

function TaskModal({ members, task, rewardCharts, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title || "");
  const [mode, setMode] = useState(task?.type === "routine" ? "routine" : task?.rotation?.length ? "rotation" : "simple");
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || "");
  const [frequency, setFrequency] = useState(task?.frequency || "quotidien");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [dueDayOfWeek, setDueDayOfWeek] = useState(Number.isInteger(task?.dueDayOfWeek) ? task.dueDayOfWeek : "");
  const [rotation, setRotation] = useState(task?.rotation || []);
  const [rotationAuto, setRotationAuto] = useState(task?.rotationAuto || "");
  const [rotationDayOfWeek, setRotationDayOfWeek] = useState(Number.isInteger(task?.rotationDayOfWeek) ? task.rotationDayOfWeek : "");
  const [notifyParent, setNotifyParent] = useState(task?.notifyParent || false);
  const [steps, setSteps] = useState(task?.steps || []);
  const [notifyTime, setNotifyTime] = useState(task?.notifyTime || "");
  const [linkedRewardChartId, setLinkedRewardChartId] = useState(task?.linkedRewardChartId || "");
  const [newStepEmoji, setNewStepEmoji] = useState("🪥");
  const [newStepLabel, setNewStepLabel] = useState("");
  const [err, setErr] = useState("");

  const toggleRotationMember = (id) => {
    setRotation(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addStep = () => {
    if (!newStepLabel.trim()) return;
    setSteps(prev => [...prev, { id: uid(), emoji: newStepEmoji, label: newStepLabel.trim() }]);
    setNewStepLabel("");
  };
  const removeStep = (id) => setSteps(prev => prev.filter(s => s.id !== id));

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setErr("Le titre est requis."); return; }
    if (mode === "routine") {
      if (steps.length < 1) { setErr("Ajoutez au moins une étape à la routine."); return; }
      onSave({
        title: title.trim(), type: "routine", steps, checkedSteps: task?.checkedSteps || {},
        assignedTo: assignedTo || null, notifyParent, notifyTime: notifyTime || null, linkedRewardChartId: linkedRewardChartId || null,
        rotation: null, rotationIndex: 0, rotationAuto: null, frequency: null, dueDate: "", dueDayOfWeek: null,
      });
    } else if (mode === "rotation") {
      if (rotation.length < 2) { setErr("Choisissez au moins deux personnes pour l'alternance."); return; }
      onSave({
        title: title.trim(), type: "chore", rotation, rotationIndex: task?.rotationIndex || 0, turnStartDate: task?.turnStartDate || todayStr(),
        rotationAuto: rotationAuto || null,
        rotationDayOfWeek: rotationAuto === "hebdomadaire" && rotationDayOfWeek !== "" ? Number(rotationDayOfWeek) : null,
        assignedTo: null, frequency: null, dueDate: "", dueDayOfWeek: null, notifyParent, steps: null,
      });
    } else {
      onSave({
        title: title.trim(), type: "chore", assignedTo: assignedTo || null, frequency,
        dueDate: frequency === "unique" ? dueDate : "",
        dueDayOfWeek: (frequency === "hebdomadaire" || frequency === "auxDeuxSemaines") && dueDayOfWeek !== "" ? Number(dueDayOfWeek) : null,
        rotation: null, rotationIndex: 0, rotationAuto: null, notifyParent, steps: null,
      });
    }
  };

  return (
    <ModalShell title={task ? "Modifier la tâche" : "Nouvelle tâche"} onClose={onClose} onSubmit={submit}>
      <label style={labelStyle}>Tâche</label>
      <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex. Sortir les poubelles, Routine du matin…" autoFocus />

      <label style={labelStyle}>Mode d'assignation</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[["simple", "Personne fixe"], ["rotation", "En alternance"], ["routine", "Routine visuelle"]].map(([key, label]) => (
          <button type="button" key={key} onClick={() => setMode(key)} style={{
            flex: 1, padding: 10, borderRadius: 8, border: `1.5px solid ${mode === key ? COLORS.accentDark : "#D8D2BE"}`,
            background: mode === key ? COLORS.accentDark : "#fff", color: mode === key ? "#fff" : COLORS.ink, fontWeight: 600, fontSize: 13,
          }}>{label}</button>
        ))}
      </div>

      {mode === "routine" ? (
        <>
          <label style={labelStyle}>Pour qui</label>
          <select style={inputStyle} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">Non assignée</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <p style={{ fontSize: 12, color: COLORS.muted, marginTop: -6, marginBottom: 10 }}>
            Une routine visuelle se réinitialise chaque jour — pensée pour un enfant qui ne lit pas encore couramment. Chaque étape s'affiche comme une grande case à toucher, avec un émoji.
          </p>

          <label style={labelStyle}>Heure du rappel (optionnel)</label>
          <select style={inputStyle} value={notifyTime} onChange={e => setNotifyTime(e.target.value)}>
            <option value="">Pas de rappel automatique</option>
            {Array.from({ length: 24 }, (_, h) => [0, 30].map(m => {
              const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
              return <option key={val} value={val}>{h}h{String(m).padStart(2, "0")}</option>;
            })).flat()}
          </select>
          <p style={{ fontSize: 12, color: COLORS.muted, marginTop: -6, marginBottom: 14 }}>
            Une notification part à cette heure-là si la routine n'est pas encore terminée. Si elle n'est toujours pas faite, jusqu'à 2 autres rappels suivent, espacés de 30 minutes.
          </p>

          {rewardCharts && rewardCharts.length > 0 && (
            <>
              <label style={labelStyle}>Lier à un défi récompense (optionnel)</label>
              <select style={inputStyle} value={linkedRewardChartId} onChange={e => setLinkedRewardChartId(e.target.value)}>
                <option value="">Aucun</option>
                {rewardCharts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <p style={{ fontSize: 12, color: COLORS.muted, marginTop: -6, marginBottom: 14 }}>
                Finir toutes les étapes de la routine coche automatiquement une étoile pour aujourd'hui sur ce défi.
              </p>
            </>
          )}

          <label style={labelStyle}>Étapes de la routine</label>
          {steps.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {steps.map(s => (
                <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 8px", borderRadius: 8, background: "#F0EAD8", fontSize: 13 }}>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span> {s.label}
                  <button type="button" onClick={() => removeStep(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, padding: 0, display: "flex" }}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {ROUTINE_EMOJIS.map(e => (
              <button type="button" key={e} onClick={() => setNewStepEmoji(e)} style={{
                width: 34, height: 34, borderRadius: 8, fontSize: 18, cursor: "pointer",
                border: `1.5px solid ${newStepEmoji === e ? COLORS.accentDark : "#D8D2BE"}`,
                background: newStepEmoji === e ? "#F0EAD8" : "#fff",
              }}>{e}</button>
            ))}
            <input value={newStepEmoji} onChange={e => setNewStepEmoji(e.target.value)} style={{
              width: 34, height: 34, borderRadius: 8, fontSize: 18, textAlign: "center", padding: 0,
              border: `1.5px solid ${!ROUTINE_EMOJIS.includes(newStepEmoji) ? COLORS.accentDark : "#D8D2BE"}`,
              background: !ROUTINE_EMOJIS.includes(newStepEmoji) ? "#F0EAD8" : "#fff",
            }} placeholder="+" title="Taper n'importe quel émoji depuis le clavier" />
          </div>
          <p style={{ fontSize: 11, color: COLORS.muted, marginTop: -6, marginBottom: 8 }}>
            Aucun émoji précis pour "sac à dos ouvert" n'existe malheureusement, mais la case avec le "+" accepte n'importe quel émoji de votre clavier (touchez-la, puis ouvrez le clavier émoji 🌐 ou 😊 de votre iPad).
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input style={{ ...inputStyle, marginBottom: 0, flex: 1 }} value={newStepLabel} onChange={e => setNewStepLabel(e.target.value)}
              placeholder="Ex. Brosser les dents" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addStep(); } }} />
            <button type="button" onClick={addStep} style={outlineBtn}><Plus size={16} /></button>
          </div>
        </>
      ) : mode === "simple" ? (
        <>
          <label style={labelStyle}>Assignée à</label>
          <select style={inputStyle} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">Non assignée</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <label style={labelStyle}>Fréquence</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {Object.entries(TASK_FREQUENCIES).map(([key, label]) => (
              <button type="button" key={key} onClick={() => setFrequency(key)} style={{
                padding: "7px 11px", borderRadius: 8, border: frequency === key ? `1.5px solid ${COLORS.accentDark}` : "1.5px solid #D8D2BE",
                background: frequency === key ? COLORS.accentDark : "#fff", color: frequency === key ? "#fff" : COLORS.ink, fontSize: 12.5, fontWeight: 600,
              }}>{label}</button>
            ))}
          </div>
          {frequency === "unique" && (
            <>
              <label style={labelStyle}>Date (optionnel)</label>
              <input type="date" style={inputStyle} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </>
          )}
          {(frequency === "hebdomadaire" || frequency === "auxDeuxSemaines") && (
            <>
              <label style={labelStyle}>Jour de la semaine (optionnel)</label>
              <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setDueDayOfWeek("")} style={{
                  padding: "6px 10px", borderRadius: 8, border: dueDayOfWeek === "" ? `1.5px solid ${COLORS.accentDark}` : "1.5px solid #D8D2BE",
                  background: dueDayOfWeek === "" ? COLORS.accentDark : "#fff", color: dueDayOfWeek === "" ? "#fff" : COLORS.ink, fontSize: 12, fontWeight: 600,
                }}>N'importe</button>
                {DAY_NAMES.map((name, i) => (
                  <button type="button" key={i} onClick={() => setDueDayOfWeek(i)} style={{
                    padding: "6px 10px", borderRadius: 8, border: dueDayOfWeek === i ? `1.5px solid ${COLORS.accentDark}` : "1.5px solid #D8D2BE",
                    background: dueDayOfWeek === i ? COLORS.accentDark : "#fff", color: dueDayOfWeek === i ? "#fff" : COLORS.ink, fontSize: 12, fontWeight: 600,
                  }}>{name.slice(0, 3)}</button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 0 }}>
                {frequency === "hebdomadaire"
                  ? "Ex. laver les draps ou la salle de bain chaque samedi ou dimanche — la tâche redevient \"à faire\" à partir de ce jour chaque semaine."
                  : "Indique le jour attendu (ex. vendredi) — la tâche redevient \"à faire\" 14 jours après avoir été cochée, peu importe le jour exact où elle a été faite."}
              </p>
            </>
          )}
        </>
      ) : (
        <>
          <label style={labelStyle}>Personnes (dans l'ordre du tour)</label>
          {members.length === 0 && <p style={{ fontSize: 12.5, color: COLORS.muted }}>Ajoutez d'abord des membres.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {members.map(m => {
              const pos = rotation.indexOf(m.id);
              const selected = pos !== -1;
              return (
                <button type="button" key={m.id} onClick={() => toggleRotationMember(m.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8,
                  border: `1.5px solid ${selected ? COLORS.accentDark : "#D8D2BE"}`, background: selected ? "#F0EAD8" : "#fff", textAlign: "left",
                }}>
                  <MemberAvatar member={m} size={26} />
                  <span style={{ flex: 1, fontSize: 14 }}>{m.name}</span>
                  {selected && <span className="mono" style={{ fontSize: 12, color: COLORS.accentDark, fontWeight: 700 }}>#{pos + 1}</span>}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: COLORS.muted, marginTop: -4, marginBottom: 12 }}>
            Chaque fois que la personne dont c'est le tour coche la tâche, le tour passe automatiquement à la suivante.
          </p>
          <label style={labelStyle}>Faire aussi tourner automatiquement</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            {[["", "Manuel seulement"], ["quotidien", "Chaque jour"], ["hebdomadaire", "Chaque semaine"], ["auxDeuxSemaines", "Aux 2 semaines"]].map(([key, label]) => (
              <button type="button" key={key || "manuel"} onClick={() => setRotationAuto(key)} style={{
                padding: "7px 11px", borderRadius: 8, border: rotationAuto === key ? `1.5px solid ${COLORS.accentDark}` : "1.5px solid #D8D2BE",
                background: rotationAuto === key ? COLORS.accentDark : "#fff", color: rotationAuto === key ? "#fff" : COLORS.ink, fontSize: 12.5, fontWeight: 600,
              }}>{label}</button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 0, marginBottom: rotationAuto === "hebdomadaire" ? 12 : 0 }}>
            {rotationAuto
              ? `Le tour changera aussi tout seul ${rotationAuto === "quotidien" ? "chaque jour" : rotationAuto === "hebdomadaire" ? "chaque semaine" : "aux 2 semaines"}, même si personne n'a coché la tâche.`
              : "Le tour ne change que lorsque quelqu'un coche la tâche comme faite."}
          </p>
          {rotationAuto === "hebdomadaire" && (
            <>
              <label style={labelStyle}>Jour du changement de tour (optionnel)</label>
              <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setRotationDayOfWeek("")} style={{
                  padding: "6px 10px", borderRadius: 8, border: rotationDayOfWeek === "" ? `1.5px solid ${COLORS.accentDark}` : "1.5px solid #D8D2BE",
                  background: rotationDayOfWeek === "" ? COLORS.accentDark : "#fff", color: rotationDayOfWeek === "" ? "#fff" : COLORS.ink, fontSize: 12, fontWeight: 600,
                }}>7 jours après le début</button>
                {DAY_NAMES.map((name, i) => (
                  <button type="button" key={i} onClick={() => setRotationDayOfWeek(i)} style={{
                    padding: "6px 10px", borderRadius: 8, border: rotationDayOfWeek === i ? `1.5px solid ${COLORS.accentDark}` : "1.5px solid #D8D2BE",
                    background: rotationDayOfWeek === i ? COLORS.accentDark : "#fff", color: rotationDayOfWeek === i ? "#fff" : COLORS.ink, fontSize: 12, fontWeight: 600,
                  }}>{name.slice(0, 3)}</button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 0 }}>
                Ex. laver les draps chaque samedi — le tour changera précisément ce jour-là, chaque semaine.
              </p>
            </>
          )}
        </>
      )}

      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "#F0EAD8", borderRadius: 8, marginBottom: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={notifyParent} onChange={e => setNotifyParent(e.target.checked)} style={{ marginTop: 2 }} />
        <span>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>Aussi avertir un parent</span>
          <span style={{ display: "block", fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
            Envoie une copie SMS aux numéros de la famille (Paramètres) en plus de l'alerte à l'enfant — utile pour un jeune enfant, en filet de sécurité.
          </span>
        </span>
      </label>

      {err && <p style={{ color: COLORS.danger, fontSize: 12.5, marginBottom: 10 }}>{err}</p>}
      <button type="submit" style={{ ...primaryBtn, width: "100%", justifyContent: "center", padding: "12px 16px" }}><Check size={16} /> Enregistrer</button>
    </ModalShell>
  );
}

// Porte d'entrée du produit : personne ne voit l'app tant qu'elle n'est pas
// connectée. Une fois connectée, la vraie app (App) prend le relais — Supabase
// et les règles de sécurité (RLS) s'occupent du reste pour que chaque famille
// ne voie jamais que ses propres données.
export default function AppWithAuth() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "#EAE2CB", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans', sans-serif", color: "#7A7256" }}>
        Un instant…
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuthed={setSession} />;
  }

  return <App session={session} />;
}
