var express = require('express');
var router = express.Router();

const uniqid = require('uniqid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

router.post('/upload', async (req, res) => {
    console.log("Received upload request for mp3", req.files);
    const mp3Path = `./tmp/${uniqid()}.mp3`;
    const resultMove = await req.files.mp3FromElevenLabs.mv(mp3Path);

    if (!resultMove) {
        console.log("File moved successfully to", mp3Path);
        console.log("reult moove:", resultMove);
        const resultCloudinary = await cloudinary.uploader.upload(mp3Path, { resource_type: "raw" });
        fs.unlinkSync(mp3Path);
        res.json({ result: true, url: resultCloudinary.secure_url })
    } else {
        res.json({ result: false, error: resultMove })
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

