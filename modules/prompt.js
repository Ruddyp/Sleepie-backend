
const WPM = 160; // 120 mots/minute

function wordsFromMinutes(min) {
    return min * WPM;
}


const getSystemPrompt = () => {
    return `
Tu es un auteur francophone d'histoires apaisantes audio.
Écris des récits immersifs, fluides et sensibles **sans** tomber dans la contemplation statique ni la description exhaustive.
Chaque scène doit faire **avancer une idée ou une émotion** et garder un **fil narratif clair** (début → progression douce → conclusion apaisante).
Style : français clair et chaleureux, phrases variées (courtes/longues), zéro inventaire de sensations, pas de conflit fort, pas de suspense.
Toujours conclure par une descente calme.
`.trim();
}


const storyType = {
    voyage: "Structure : 3–4 étapes de déplacement avec repères sensoriels légers.",
    rencontre: "Structure : 2–3 moments d'échange (préparation, cœur, retombée douce).",
    lieu: "Structure : découverte progressive d'un lieu (zones/espaces) sans surcharge descriptive.",
    journee: "Structure : progression temporelle (matin → après-midi → soir) avec mini-rituels.",
}
const location = {
    mer: "Présence discrète : souffle du vent, rythme des vagues, lumière salée.",
    nature: "Présence discrète : feuillages, relief, souffle du vent, matières.",
    village: "Présence discrète : ruelles, voix lointaines, objets du quotidien.",
    imaginaire: "Imaginaire doux et crédible : réalisme poétique, jamais l'aventure spectaculaire.",
}
const protagonist = {
    voyageur: "Point de vue en mouvement, curiosité calme, observation ciblée (pas d'inventaire).",
    habitant: "Point de vue ancré, gestes concrets, temporalité stable.",
    confident: "Point de vue humain, brèves interactions/chaleur, dialogues courts et naturels.",
    reveur: "Point de vue poétique mais **ancré**, images légères sans flou excessif.",
}
const effect = {
    realiste: "Ancrage réel, objets/gestes/sons identifiables, éviter toute irruption d'irréel.",
    meditative: "Rythme lent mais **signifiant** ; privilégier respiration et sensations **sélectionnées**.",
    introspective: "Pensées calmes et claires, compréhension douce ; pas de lourdeur psychologique.",
    imaginaire: "Réalise un glissement poétique **discret** (réalisme magique doux) sans rupture brusque.",
}

const choice1 = "voyage"
const choice2 = "mer"
const choice3 = "voyageur"
const choice4 = "realiste"


function generateDetailledChoices(choice1, choice2, choice3, choice4) {
    return {
        storyType: storyType[choice1],
        location: location[choice2],
        protagonist: protagonist[choice3],
        effect: effect[choice4],
    }
}

const getUserPrompt = (choice1, choice2, choice3, choice4, duration) => {
    const nbWords = wordsFromMinutes(duration)
    const detailledChoice = generateDetailledChoices(choice1, choice2, choice3, choice4)
    return `
Consignes générales :
- Écris une histoire originale et apaisante en français (~${nbWords} mots, tolérance ±5 %).
- Le récit doit avoir un **sens clair** et une **progression douce** (jamais statique).
- Évite les énumérations sensorielles et la redondance ; sélectionne des images **signifiantes**.
- Conclus toujours sur une **retombée paisible**.

Guide selon les choix ci-dessous : 
- Type d'histoire : ${choice1} : ${detailledChoice.storyType} 
- Cadre et ambiance : ${choice2} : ${detailledChoice.location}
- Héros : ${choice3} : ${detailledChoice.protagonist}
- Atmosphère intérieure : ${choice4} : ${detailledChoice.effect}

Sortie :
- D'abord un **titre court** (≤ 40 caractères) sur une seule ligne.
- Puis l'histoire en texte continu (pas de listes, pas de sous-titres).
`.trim()
}


module.exports = {
    getUserPrompt,
    getSystemPrompt,
};



