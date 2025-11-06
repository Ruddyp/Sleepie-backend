const WPM = 160; // 120 mots/minute

function wordsFromMinutes(min) {
  return min * WPM;
}

// SYSTEM PROMPT

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

// USER CHOICE PROMPT

const storyType = {
  "Un voyage":
    "Structure : 3–4 étapes de déplacement dans un lieu dépaysant propice au voyage.",
  "Une rencontre":
    "Structure : 2–3 moments d'échange calme entre deux personnes bienveillantes.",
  "Un lieu à explorer":
    "Structure : découverte progressive d'un lieu (zones/espaces) sans surcharge descriptive.",
  "Un moment de vie":
    "Structure : progression temporelle (matin → après-midi → soir) dans un moment de vie du quotidien.",
};
const location = {
  "Près de la mer":
    "L'action de l'histoire se déroule en bord de mer ou en mer : sur un bateau, dans une ville au bord de la mer, sur la plage ou tout autre endroit proche de la mer.",
  "Dans la nature":
    "L'action de l'histoire se déroule dans un environnement naturel : forêt, montagne, campagne, désert, etc.",
  "À la campagne":
    "L'action de l'histoire se déroule dans un environnement rural : ferme, petit village, hameau, etc.",
  "Dans un lieu imaginaire ":
    "L'action de l'histoire se déroule dans un lieu inventé, magique ou fantastique, mais toujours apaisant et crédible.",
};
const protagonist = {
  Voyageur:
    "Le personnage principal est un explorateur curieux, ouvert d'esprit, et attentif aux détails de son environnement.",
  "Vous et moi":
    "Le personnage principal est un résident calme, ancré dans son quotidien, et en harmonie avec son environnement.",
  Confident:
    "Le personnage principal est une personne bienveillante, à l'écoute, et capable de créer des liens chaleureux avec les autres.",
  Rêveur:
    "Le personnage principal est une personne imaginative, poétique, et capable de voir la beauté dans les petites choses.",
};
const effect = {
  Réaliste:
    "Ancrage réel, objets/gestes/sons identifiables, éviter toute irruption d'irréel.",
  "Méditative ":
    "Rythme lent mais **signifiant** ; privilégier respiration et sensations **sélectionnées**.",
  "Introspective ":
    "Pensées calmes et claires, compréhension douce ; pas de lourdeur psychologique.",
  Imaginaire:
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

  const nameLine = characterName
    ? `- Le protagoniste s'appelle ${characterName}.`
    : "";
  const weatherLine = weather
    ? `- L'histoire se déroule avec une météo : ${weather}.`
    : "";

  // CONSIGNES GÉNÉRALES D'UTILISATION DU PROMPT
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
- Protagoniste : ${choice3} : ${detailledChoice.protagonist}
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
