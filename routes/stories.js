var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Story = require("../models/stories");
const { checkBody } = require("../modules/checkBody");
const Category = require("../models/categories");
const { getRandomImageUrl } = require("../modules/images");

const { InferenceClient } = require("@huggingface/inference");

const { ElevenLabsClient /*, play*/ } = require("@elevenlabs/elevenlabs-js");
const { Readable } = require("node:stream");

require("dotenv/config");

const uniqid = require("uniqid");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const { wordsFromMinutes, buildStoryPrompts, extractTitleAndBody } = require("../modules/prompt");
const { max, duration } = require("moment/moment");

// lier les 3 étapes
// ajouter uniqid pour nom de fichier unique
// supprimer le fichier local après upload

async function UploadMP3ToCLoudinary(mp3Path) {
  const resultCloudinary = await cloudinary.uploader.upload(mp3Path, {
    resource_type: "raw",
  });
  fs.unlinkSync(mp3Path);
  return resultCloudinary.secure_url;
}

const testGeneration = async (systemPrompt, userPrompt, client, max_tokens) => {
  const out = await client.chatCompletion({
    model: "meta-llama/Llama-3.1-70B-Instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: max_tokens, // ~1000 mots (1 mot ≈ 1.3 à 1.5 tokens)
    temperature: 0.7,
    top_p: 0.9,
    presence_penalty: 0.1,
    frequency_penalty: 0.3,
  });

  console.log(out.choices[0].message.content);
  return out.choices[0].message.content;
};

// ROUTE COMPLETE

router.post("/create", async (req, res) => {
  const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

  const client = new InferenceClient(HF_TOKEN);

  // 1) Durée -> mots cibles via wordsFromMinutes
  const durationMin = Number(req.body.duration) || 5;
  const targetWords = wordsFromMinutes(durationMin);
  console.log("[DEBUG] duration:", durationMin, "=> targetWords:", targetWords);

  // Construire les prompts
  const { system, user } = buildStoryPrompts({
    voice: req.body.voice,
    storyType: req.body.storyType, // ex: "voyage" | "rencontre" | "lieu" | "journee"
    location: req.body.location, // "mer" | "nature" | "village" | "imaginaire"
    protagonist: req.body.protagonist, // "voyageur" | "habitant" | "confident" | "reveur"
    effect: req.body.effect, // "realiste" | "meditative" | "introspective" | "imaginaire"
    duration: req.body.duration, // minutes
  });

  // Génération du texte
  const textFromIA = await testGeneration(system, user, client, targetWords * 1.5);
  // Récupération du titre
  const { title, body } = extractTitleAndBody(textFromIA);
  console.log({ title });
  console.log({ body });
  // Récupéaration d'une image aléatoire
  const imageUrl = getRandomImageUrl();

  // ELEVENLABS QUICKSTART
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
    text: body, //ajouter le résultat de la génération de texte ici
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
    const cloudinaryUrl = await UploadMP3ToCLoudinary(mp3Path);

    // Sauvegarde en base de données
    const user = await User.findOne({ token: req.body.token });
    if (!user) {
      return res.json({ result: false, error: "Utilisateur non trouvé" });
    }
    const newStory = new Story({
      url: cloudinaryUrl,
      author: user._id,
      created_at: new Date(),
      title: title,
      image: imageUrl,
      configuration: {
        duration: req.body.duration,
        speaker: voiceId,
      },
    });
    await newStory.save();
    const story = await Story.findOne({ url: cloudinaryUrl });

    res.json({ result: true, story: story });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

// ROUTE GET STORIES BY AUTHOR
router.post("/getbyauthor", async (req, res) => {
  const { author } = req.body;
  if (!checkBody(req.body, ["author"])) {
    return res.json({ result: false, error: "Manque un author Id pour réaliser la requête" });
  }
  try {
    const stories = await Story.find({ author: req.body.author }).populate("label");
    if (stories.length === 0) {
      return res.json({ result: false, error: "Aucune histoire trouvée pour cet utilisateur" });
    }
    res.json({ result: true, stories: stories });
  } catch (error) {
    console.log("error in /getbyauthor", error);
    res.json({ result: false, error: "Erreur serveur lors de la récupération des histoires" });
  }
});

module.exports = router;
