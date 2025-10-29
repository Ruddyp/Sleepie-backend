import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

const client = new InferenceClient(HF_TOKEN);

const storyPrompt = `
Tu es un narrateur francophone expert en histoires apaisantes pour dormir. Ton style est calme, immersif, lent et réaliste, avec un langage sensoriel (sons, lumière, température, sensations corporelles). Ton objectif est d’apaiser l’esprit du lecteur et de l’aider à s’endormir.

Écris une histoire réaliste d’environ 1000 mots.

Type d’histoire : Un voyage apaisant dans la nature  
Protagoniste : une femme  
Lieu : petit village au bord d’un lac entouré de collines  
Effet recherché : sentiment profond de sécurité et d’apaisement

Structure :
1. Introduction douce décrivant l’atmosphère et les premières sensations.
2. Déplacement lent dans la nature (marche, air doux, sons de l’eau, lumière du soir).
3. Réflexion intérieure positive, gratitude, paix.
4. Conclusion sereine, respiration calme, esprit détendu.

Contraintes :
- Aucun élément fantastique ou irréel
- Aucun suspense, conflit ou tension
- Ton neutre, chaleureux, stable
- Rythme lent, descriptif et répétitif de manière apaisante (mais sans redondance inutile)

Commence maintenant.
`.trim();

const testGeneration = async () => {
  const out = await client.chatCompletion({
    model: "meta-llama/Llama-3.1-70B-Instruct",
    messages: [
      {
        role: "system",
        content:
          "Tu es un écrivain francophone spécialisé dans les histoires réalistes et apaisantes destinées à favoriser l'endormissement.",
      },
      {
        role: "user",
        content: storyPrompt,
      },
    ],
    max_tokens: 1800, // ~1000 mots (1 mot ≈ 1.3 à 1.5 tokens)
    temperature: 0.7,
    top_p: 0.9,
    presence_penalty: 0.1,
    frequency_penalty: 0.3,
  });

  console.log(out.choices[0].message.content);
};

testGeneration();

// ELEVENLABS QUICKSTART

import { ElevenLabsClient /*, play*/ } from "@elevenlabs/elevenlabs-js";
import { Readable } from "node:stream";
import fs from "node:fs";
import "dotenv/config";

const EL_TOKEN = process.env.ELEVENLABS_API_KEY;
const EL_VOICE = process.env.ELEVENLABS_VOICE_ID; // optionnel

if (!EL_TOKEN) {
  throw new Error("Missing ELEVENLABS_API_KEY in .env");
}
//lol
const clientEL = new ElevenLabsClient({
  apiKey: EL_TOKEN, // ✅ variable, pas une string littérale
});

// Remplace par ta voix ou garde celle de l'env (fallback sur Rachel)
const voiceId = EL_VOICE || "21m00Tcm4TlvDq8ikWAM"; // ✅ variable, pas "EL_VOICE"

const audio = await clientEL.textToSpeech.convert(voiceId, {
  text: "Le premier geste met tout en mouvement. Respire et détends-toi.",
  modelId: "eleven_multilingual_v2",
  outputFormat: "mp3_44100_128",
});

// Transformer le reader en stream Node
const reader = audio.getReader();
const stream = new Readable({
  async read() {
    const { done, value } = await reader.read();
    this.push(done ? null : value);
  },
});

// 1) Pour LIRE le son localement :
// 1) Pour LIRE le son (machine locale avec sortie audio) :
// await play(stream);

// 2) Pour SAUVEGARDER en MP3 :
const out = fs.createWriteStream("quickstart_test.mp3");
stream.pipe(out);
await new Promise((resolve, reject) => {
  out.on("finish", resolve);
  out.on("error", reject);
});
console.log("✅ MP3 enregistré : quickstart_test.mp3");
