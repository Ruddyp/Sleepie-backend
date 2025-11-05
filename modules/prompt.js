const WPM = 160; // 120 mots/minute

function wordsFromMinutes(min) {
  return min * WPM;
}

const getSystemPrompt = () => {
  return `
Tu es un auteur francophone d'histoires apaisantes audio.

But :
- Écrire des récits immersifs, fluides et sensibles, **sans lourdeur ni redondance**.
- Narration claire : **début → évolution → retombée paisible**.
- Personnages humains crédibles, dialogues **brefs** et naturels (si utiles).

Style :
- Français clair et chaleureux, rythme varié (phrases courtes/moyennes/longues).
- Images **sélectionnées** : chaque détail doit **faire avancer** l’idée ou l’émotion.
- **Aucune énumération sensorielle** ni description statique.
- Jamais abstrait ou dissertation philosophique : c'est une **histoire incarnée**.
- Toujours conclure par une **descente calme**.

Anti-répétition (très important) :
- Après la **première** mention du prénom, privilégie **il/elle** et la **périphrase** ; **n’écris le prénom qu’une fois toutes les 4–6 phrases** (sauf dialogue).
- Varie l’attaque des phrases : évite une suite de phrases commençant par **Il/Elle**.
- Ne répète pas un même mot saillant (adjectif/verbe/image) dans un **périmètre de 2 phrases** : utilise des **synonymes**.
- Mentionne la **météo une fois** (mise en place), puis laisse-la en **arrière-plan**.
- Une seule métaphore légère par paragraphe, pas de tics de langage.
- Avant de finir, fais une **micro-relecture** : supprime répétitions et doublons, fusionne les phrases redondantes.
`.trim();
};

const storyType = {
  voyage:
    "Structure : 3–4 étapes de déplacement avec repères sensoriels légers.",
  rencontre:
    "Structure : 2–3 moments d'échange (préparation, cœur, retombée douce).",
  lieu: "Structure : découverte progressive d'un lieu (zones/espaces) sans surcharge descriptive.",
  journee:
    "Structure : progression temporelle (matin → après-midi → soir) avec mini-rituels.",
};
const location = {
  mer: "Présence discrète : souffle du vent, rythme des vagues, lumière salée.",
  nature: "Présence discrète : feuillages, relief, souffle du vent, matières.",
  village: "Présence discrète : ruelles, voix lointaines, objets du quotidien.",
  imaginaire:
    "Imaginaire doux et crédible : réalisme poétique, jamais l'aventure spectaculaire.",
};
const protagonist = {
  voyageur:
    "Point de vue en mouvement, curiosité calme, observation ciblée (pas d'inventaire).",
  habitant: "Point de vue ancré, gestes concrets, temporalité stable.",
  confident:
    "Point de vue humain, brèves interactions/chaleur, dialogues courts et naturels.",
  reveur:
    "Point de vue poétique mais **ancré**, images légères sans flou excessif.",
};
const effect = {
  realiste:
    "Ancrage réel, objets/gestes/sons identifiables, éviter toute irruption d'irréel.",
  meditative:
    "Rythme lent mais **signifiant** ; privilégier respiration et sensations **sélectionnées**.",
  introspective:
    "Pensées calmes et claires, compréhension douce ; pas de lourdeur psychologique.",
  imaginaire:
    "Réalise un glissement poétique **discret** (réalisme magique doux) sans rupture brusque.",
};

function generateDetailledChoices(choice1, choice2, choice3, choice4) {
  return {
    storyType: storyType[choice1],
    location: location[choice2],
    protagonist: protagonist[choice3],
    effect: effect[choice4],
  };
}

const getUserPrompt = (
  choice1,
  choice2,
  choice3,
  choice4,
  duration,
  characterName,
  weather
) => {
  const nbWords = wordsFromMinutes(duration);
  const detailledChoice = generateDetailledChoices(
    choice1,
    choice2,
    choice3,
    choice4
  );

  const protagonistLine = choice3
    ? `- Héros : ${choice3} : ${detailledChoice.protagonist}`
    : "- Héros : libre, à ton choix (garde le ton apaisant et humain).";

  const nameLine = characterName
    ? `- Le protagoniste s'appelle ${characterName}.`
    : "";
  const weatherLine = weather
    ? `- L'histoire se déroule avec une météo : ${weather}.`
    : "";

  return `
Consignes générales :
- Écris une histoire originale, apaisante et **narrativement cohérente** (~${nbWords} mots, tolérance –0 %, +5 %).
- Le texte doit contenir **au minimum ${nbWords} mots**. Si nécessaire, ajoute de petites scènes ou dialogues pour atteindre ce seuil sans rallonger artificiellement.
- Structure obligatoire : **début (mise en place)** → **milieu (évolution)** → **fin (retombée douce)**.
- Le récit doit avoir un **sens clair** et une **progression douce** (jamais statique).
- Intègre **au moins un personnage nommé**, crédible et bienveillant.
- Aucune énumération de sensations. Choisis des détails concrets et signifiants.
- Évite les énumérations sensorielles et la redondance ; sélectionne des images **signifiantes**.
- Le ton doit rester **serein et humain**, jamais abstrait.
- Conclus toujours sur une **retombée paisible**.
- Tu dois **absolument respecter le nombre de mots** indiqué pour la durée.

Guide selon les choix ci-dessous : 
- Type d'histoire : ${choice1} : ${detailledChoice.storyType} 
- Cadre et ambiance : ${choice2} : ${detailledChoice.location}
${protagonistLine}
${nameLine ? nameLine + "\n" : ""}
${weatherLine ? weatherLine + "\n" : ""}
- Atmosphère intérieure : ${choice4} : ${detailledChoice.effect}

Sortie :
- D'abord un **titre court** (≤ 40 caractères) sur une seule ligne sans aucun caractères spéciaux.
- Puis l'histoire en texte continu (pas de listes, pas de sous-titres).
`.trim();
};

module.exports = {
  getUserPrompt,
  getSystemPrompt,
};
