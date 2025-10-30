// modules/promptBuilder.js
// Centralise la construction du prompt et utilitaires associés (CommonJS)

const WPM = 120; // 120 mots/minute

function wordsFromMinutes(min) {
  return min * WPM;
}

// Normalise les noms venant de l'app (compatibilité avec ton body actuel)
function normalizeParams(raw) {
  return {
    // écrans validés
    storyType: raw.storyType || "voyage", // voyage | rencontre | lieu | journee
    location: raw.location || "mer", // mer | nature | village | imaginaire
    protagonist: raw.protagonist || "voyageur", // voyageur | habitant | confident | reveur
    effect: raw.effect || "realiste", // realiste | meditative | introspective | imaginaire
    duration: Number(raw.duration) || 5,
    voice: raw.voice || "feminine_soft",
  };
}

// SYSTEM prompt : règles globales (anti “trop contemplatif”)
const SYSTEM_PROMPT = `
Tu es un auteur francophone d'histoires apaisantes audio.
Écris des récits immersifs, fluides et sensibles **sans** tomber dans la contemplation statique ni la description exhaustive.
Chaque scène doit faire **avancer une idée ou une émotion** et garder un **fil narratif clair** (début → progression douce → conclusion apaisante).
Style : français clair et chaleureux, phrases variées (courtes/longues), zéro inventaire de sensations, pas de conflit fort, pas de suspense.
Toujours conclure par une descente calme.
`.trim();

// Construit le USER prompt à partir des 6 écrans (+ mots cibles)
function buildUserPrompt(p) {
  const targetWords = wordsFromMinutes(p.duration);

  // Petites aides rédactionnelles (optionnelles) selon le type d’histoire
  const structureByType =
    {
      voyage: `Structure : 3–4 étapes de déplacement avec repères sensoriels légers.`,
      rencontre: `Structure : 2–3 moments d'échange (préparation, cœur, retombée douce).`,
      lieu: `Structure : découverte progressive d'un lieu (zones/espaces) sans surcharge descriptive.`,
      journee: `Structure : progression temporelle (matin → après-midi → soir) avec mini-rituels.`,
    }[p.storyType] || "";

  // Cadre en quelques mots (ne pas saturer)
  const cadreHints =
    {
      mer: `Présence discrète : souffle du vent, rythme des vagues, lumière salée.`,
      nature: `Présence discrète : feuillages, relief, souffle du vent, matières.`,
      village: `Présence discrète : ruelles, voix lointaines, objets du quotidien.`,
      imaginaire: `Imaginaire doux et crédible : réalisme poétique, jamais l'aventure spectaculaire.`,
    }[p.location] || "";

  // Héros & point de vue
  const heroHints =
    {
      voyageur: `Point de vue en mouvement, curiosité calme, observation ciblée (pas d'inventaire).`,
      habitant: `Point de vue ancré, gestes concrets, temporalité stable.`,
      confident: `Point de vue humain, brèves interactions/chaleur, dialogues courts et naturels.`,
      reveur: `Point de vue poétique mais **ancré**, images légères sans flou excessif.`,
    }[p.protagonist] || "";

  // Atmosphère intérieure (degré d’imaginaire / réflexion)
  const toneHints =
    {
      realiste: `Ancrage réel, objets/gestes/sons identifiables, éviter toute irruption d'irréel.`,
      meditative: `Rythme lent mais **signifiant** ; privilégier respiration et sensations **sélectionnées**.`,
      introspective: `Pensées calmes et claires, compréhension douce ; pas de lourdeur psychologique.`,
      imaginaire: `Réalise un glissement poétique **discret** (réalisme magique doux) sans rupture brusque.`,
    }[p.effect] || "";

  // Prompt utilisateur final (titre + histoire)
  return `
Paramètres (ne pas afficher dans le texte) :
- Voix : ${p.voice}
- Type d’histoire : ${p.storyType}
- Cadre & ambiance : ${p.location}
- Héros : ${p.protagonist}
- Atmosphère intérieure : ${p.effect}
- Durée : ${p.duration} min (≈ ${targetWords} mots)

Consignes générales :
- Écris une histoire originale et apaisante en français (~${targetWords} mots, tolérance ±5 %).
- Le récit doit avoir un **sens clair** et une **progression douce** (jamais statique).
- Évite les énumérations sensorielles et la redondance ; sélectionne des images **signifiantes**.
- Conclus toujours sur une **retombée paisible**.

Guides selon les choix :
• Type : ${p.storyType} → ${structureByType}
• Cadre : ${p.location} → ${cadreHints}
• Héros : ${p.protagonist} → ${heroHints}
• Atmosphère : ${p.effect} → ${toneHints}

Sortie :
- D'abord un **titre court** (≤ 40 caractères) sur une seule ligne.
- Puis l'histoire en texte continu (pas de listes, pas de sous-titres).
`.trim();
}

function buildStoryPrompts(rawParams) {
  const p = normalizeParams(rawParams);
  return {
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(p),
    targetWords: wordsFromMinutes(p.duration),
  };
}

// Extraction : 1ère ligne = titre, reste = corps
function extractTitleAndBody(generated) {
  if (!generated) return { title: "", body: "" };
  const lines = generated.split(/\r?\n/).filter((l) => l.trim() !== "");
  const title = (lines[0] || "").trim().slice(0, 40); // garde court au cas où
  const body = lines.slice(1).join("\n").trim();
  return { title, body };
}

module.exports = {
  wordsFromMinutes,
  buildStoryPrompts,
  extractTitleAndBody,
};
