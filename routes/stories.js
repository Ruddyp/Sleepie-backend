var express = require('express');
var router = express.Router();
const User = require('../models/users');
const Story = require('../models/stories');

const { InferenceClient } = require("@huggingface/inference");

const { ElevenLabsClient /*, play*/ } = require("@elevenlabs/elevenlabs-js");
const { Readable } = require("node:stream");

require("dotenv/config");

const uniqid = require('uniqid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// lier les 3 étapes
// ajouter uniqid pour nom de fichier unique
// supprimer le fichier local après upload

async function UploadMP3ToCLoudinary(mp3Path) {
    const resultCloudinary = await cloudinary.uploader.upload(mp3Path, { resource_type: "raw" });
    fs.unlinkSync(mp3Path);
    return resultCloudinary.secure_url;
}


const testGeneration = async (storyPrompt, client) => {
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
    return out.choices[0].message.content;

};

// ROUTE DE TEST COMPLETE

router.post('/create', async (req, res) => {

    const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

    const client = new InferenceClient(HF_TOKEN);

    const nbWords = req.body.duration * 120; // approx 120 mots par minute

    const storyPrompt = `
Écris une histoire réaliste d’environ ${nbWords} mots.

Type d’histoire : ${req.body.storyType}  
Protagoniste : ${req.body.protagonist}  
Lieu : ${req.body.location}  
Effet recherché : ${req.body.effect}

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

    // ELEVENLABS QUICKSTART
    const textFromIA = await testGeneration(storyPrompt, client);
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
        text: textFromIA,  //ajouter le résultat de la génération de texte ici
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
    const mp3Path = `./${uniqid()}_story.mp3`;
    const mp3 = fs.createWriteStream(mp3Path);
    stream.pipe(mp3);
    await new Promise((resolve, reject) => {
        mp3.on("finish", resolve);
        mp3.on("error", reject);
    });
    console.log("MP3 enregistré : ", mp3Path);

    // Upload vers Cloudinary
    try {
        const cloudinaryUrl = await UploadMP3ToCLoudinary(mp3Path)

        const user = await User.findOne({ token: req.body.token })
        if (!user) {
            return res.json({ result: false, error: "Utilisateur non trouvé" })
        }
        const newStory = new Story({
            url: cloudinaryUrl,
            author: user._id,
            created_at: new Date(),
            configuration: {
                duration: req.body.duration,
                speaker: voiceId,
            }
        })
        await newStory.save();
        const story = await Story.findOne({ url: cloudinaryUrl })

        res.json({
            result: true, data: {
                id: story._id,
                title: story.title,
                url: story.cloudinaryUrl,
                created_at: story.created_at,
                author: story.author,
            }
        })


    } catch (error) {
        res.json({ result: false, error: error.message })
    }

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

