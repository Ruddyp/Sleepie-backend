var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Story = require("../models/stories");
const Category = require("../models/categories");
const { checkBody } = require("../modules/checkBody");
const { getRandomImageUrl } = require("../modules/images");

const { InferenceClient } = require("@huggingface/inference");

const { ElevenLabsClient /*, play*/ } = require("@elevenlabs/elevenlabs-js");
const { Readable } = require("node:stream");

const { getUserPrompt, getSystemPrompt } = require("../modules/prompt");

require("dotenv/config");

const uniqid = require("uniqid");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

async function UploadMP3ToCLoudinary(mp3Path) {
  const resultCloudinary = await cloudinary.uploader.upload(mp3Path, {
    resource_type: "raw",
  });
  fs.unlinkSync(mp3Path);
  return resultCloudinary.secure_url;
}

const textGeneration = async (systemPrompt, userPrompt, client, max_tokens) => {
  const out = await client.chatCompletion({
    model: "meta-llama/Llama-3.1-70B-Instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: max_tokens, // ~1000 mots (1 mot ≈ 1.3 à 1.5 tokens)
    temperature: 0.8,
    top_p: 0.9,
    presence_penalty: 0.1,
    frequency_penalty: 0.3,
  });

  console.log(out.choices[0].message.content);
  return out.choices[0].message.content;
};

const voiceMap = {
  clement: "jUHQdLfy668sllNiNTSW",
  emilie: "qMfbtjrTDTlGtBy52G6E",
  nicolas: "aQROLel5sQbj1vuIVi6B",
  sandra: "1sN2yEgg4e2fcRWbLnuF",
};

function resolveVoiceId(persona) {
  return voiceMap[String(persona).toLowerCase()];
}

// ROUTE COMPLETE

router.post("/create", async (req, res) => {
  console.log("body", req.body);
  const { token, storyType, location, protagonist, effect, duration, voice, otherParam } = req.body;
  const { characterName, weather } = otherParam;
  if (
    !checkBody(req.body, [
      "token",
      "storyType",
      "location",
      "protagonist",
      "effect",
      "duration",
      "voice",
    ])
  ) {
    return res.json({ result: false, error: "Information manquantes" });
  }

  const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;
  const client = new InferenceClient(HF_TOKEN);

  // Construire les prompts
  const userPrompt = getUserPrompt(
    storyType,
    location,
    protagonist,
    effect,
    duration,
    characterName,
    weather
  );
  const systemPrompt = getSystemPrompt();

  // Génération du texte
  const textFromIA = await textGeneration(systemPrompt, userPrompt, client, duration * 160 * 1.3);

  //Extraction du title
  const title = textFromIA.split("\n")[0];

  // Récupéaration d'une image aléatoire
  const imageUrl = getRandomImageUrl();

  // ELEVENLABS QUICKSTART
  const EL_TOKEN = process.env.ELEVENLABS_API_KEY;

  if (!EL_TOKEN) {
    throw new Error("Missing ELEVENLABS_API_KEY in .env");
  }

  const clientEL = new ElevenLabsClient({
    apiKey: EL_TOKEN,
  });

  // Choix de la voix
  const voiceId = resolveVoiceId(voice);

  const audio = await clientEL.textToSpeech.convert(voiceId, {
    text: textFromIA, //ajouter le résultat de la génération de texte ici
    modelId: "eleven_flash_v2_5",
    outputFormat: "mp3_44100_96",
    voiceSettings: {
      stability: 0.65,
      useSpeakerBoost: true,
      speed: 0.92,
    },
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
    const user = await User.findOne({ token: token });
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
        duration: duration,
        speaker: voiceId,
      },
    });
    await newStory.save();
    const story = await Story.findOne({ url: cloudinaryUrl }).populate("author");

    res.json({ result: true, story: story });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

// ROUTE GET STORIES BY AUTHOR
router.get("/sleepiestories", async (req, res) => {
  const sleepyId = process.env.SLEEPIE_ID;

  try {
    const stories = await Story.find({ author: sleepyId })
      .populate("label")
      .populate("author")
      .populate("like");
    if (stories.length === 0) {
      return res.json({
        result: false,
        error: "Aucune histoire trouvée pour cet utilisateur",
      });
    }
    res.json({ result: true, stories: stories });
  } catch (error) {
    console.log("error in /sleepiestories", error);
    res.json({
      result: false,
      error: "Erreur serveur lors de la récupération des histoires",
    });
  }
});

// ROUTE GET STORIES BY FAVORITES

router.post("/favorites", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.json({ result: false, error: "Token manquant" });
  }
  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.json({ result: false, error: "Utilisateur non trouvé" });
    }
    const myStories = await Story.find({ author: user._id }).populate("author").populate("like");
    const storiesLiked = await Story.find({
      like: { $in: [user._id] },
    })
      .populate("author")
      .populate("like");
    res.json({ result: true, myStories, storiesLiked });
  } catch (error) {
    console.log("error in /favorites", error);
    res.json({
      result: false,
      error: "Erreur serveur lors de la récupération des histoires favorites",
    });
  }
});

// ROUTE POST LIKE

router.post("/like", async (req, res) => {
  console.log(req.body);
  const { token, storyId } = req.body;
  if (!checkBody(req.body, ["token", "storyId"])) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  // recherche du user
  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.json({ result: false, message: "User doesn't exist" });
    }
    // recherche de la story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.json({ result: false, message: "Story doesn't exist" });
    }

    const alreadyLiked = story.like.some((id) => id.toString() === user._id.toString());

    let newLikeArray = story.like;

    if (alreadyLiked) {
      newLikeArray = newLikeArray.filter((id) => id.toString() !== user._id.toString());
    } else {
      newLikeArray.push(user._id);
    }

    const resultat = await Story.updateOne({ _id: storyId }, { like: newLikeArray });
    console.log("resultat", resultat);
    if (resultat.modifiedCount === 1) {
      res.json({ result: true, message: "Story successfully like/unlike" });
    } else {
      res.json({ result: false, message: "No modification" });
    }
  } catch (error) {
    res.json({ result: false, messageFromCatch: error.message });
  }
});

// route au play d'une histoire. MAJ du counter de la story + ajout de la story dans les "dernières écoutes"

router.post("/play", async (req, res) => {
  const { token, storyId } = req.body;
  if (!checkBody(req.body, ["token", "storyId"])) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }
  try {
    await Story.updateOne({ _id: storyId }, { $inc: { listen_counter: 1 } });
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.json({ result: false, message: "user not found" });
    }
    user.recently_played = user.recently_played.filter((id) => id.toString() !== storyId);

    user.recently_played.unshift(storyId);
    const newArray = user.recently_played;
    if (newArray.length > 10) {
      newArray.pop();
    }
    await user.save();
    res.json({
      result: true,
      message: "counter mis à jour et tableau recently_played modifié",
    });
  } catch (error) {
    res.json({ result: false, messageFromCatch: error.message });
  }
});

// ROUTE GET TOP TEN FROM SLEEPIE
router.get("/mostlistenedstories", async (req, res) => {
  const sleepyId = process.env.SLEEPIE_ID;

  try {
    const stories = await Story.find({ author: sleepyId })
      .populate("label")
      .populate("author")
      .populate("like");
    if (stories.length === 0) {
      return res.json({
        result: false,
        error: "Aucune histoire trouvée pour cet utilisateur",
      });
    }
    const mostListenedStories = stories
      .sort((a, b) => b.listen_counter - a.listen_counter)
      .slice(0, 10);

    res.json({ result: true, mostListenedStories: mostListenedStories });
  } catch (error) {
    console.log("error in /sleepiestories", error);
    res.json({
      result: false,
      error: "Erreur serveur lors de la récupération des histoires",
    });
  }
});

module.exports = router;
