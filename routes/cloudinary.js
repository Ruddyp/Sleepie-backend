var express = require('express');
var router = express.Router();
const User = require('../models/users');
const { InferenceClient } = require("@huggingface/inference");

const { ElevenLabsClient /*, play*/ } = require("@elevenlabs/elevenlabs-js");
const { Readable } = require("node:stream");

require("dotenv/config");

const uniqid = require('uniqid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');



router.get('/testcloudinary', async (req, res) => {

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

    // Génération de texte avec Hugging Face
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
        return out;

    };

    testGeneration();

    // ELEVENLABS QUICKSTART
    out = await testGeneration();
    const EL_TOKEN = process.env.ELEVENLABS_API_KEY;
    const EL_VOICE = process.env.ELEVENLABS_VOICE_ID; // voix personnalisée optionnelle

    if (!EL_TOKEN) {
        throw new Error("Missing ELEVENLABS_API_KEY in .env");
    }

    const clientEL = new ElevenLabsClient({
        apiKey: EL_TOKEN,
    });

    // Choix de la voix
    const voiceId = EL_VOICE || "21m00Tcm4TlvDq8ikWAM";

    const audio = await clientEL.textToSpeech.convert(voiceId, {
        text: out.choices[0].message.content,  //ajouter le résultat de la génération de texte ici
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

    // 2) Pour SAUVEGARDER en MP3 :
    const out = fs.createWriteStream("quickstart_testdefou.mp3");
    stream.pipe(out);
    await new Promise((resolve, reject) => {
        out.on("finish", resolve);
        out.on("error", reject);
    });
    console.log("✅ MP3 enregistré : quickstart_testdefou.mp3");

    const resultCloudinary = await cloudinary.uploader.upload("./quickstart_testdefou.mp3", { resource_type: "raw" });
    // fs.unlinkSync("./quickstart_test.mp3");
    console.log({ result: true, url: resultCloudinary.secure_url })
    res.json({ result: true, url: resultCloudinary.secure_url })

})


module.exports = router;


// A RECUPERER POUR TESTER L'UPLOAD DEPUIS LA RECUPERATION EVLEN LABS
// const formData = new FormData();
//     formData.append('mp3FromElevenLabs', {
//       uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
//       type: 'audio/mp3',
//       name: 'monAudio.mp3',
//     });
//     console.log(formData)

//     try {
//       const response = await fetch(`http://${IP}:${port}/cloudinary/upload`, {
//         method: 'POST',
//         body: formData,
//       })
//       const data = await response.json();
//       console.log("Response from backend:", data);
//     } catch (error) {
//       console.log("Error while uploading to Cloudinary:", error);
//     }

