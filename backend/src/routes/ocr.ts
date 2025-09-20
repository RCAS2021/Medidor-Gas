const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const router = express.Router();

router.post("/parse", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Nenhuma imagem fornecida" });
    }

    const FormData = require("form-data");
    const formData = new FormData();
    formData.append("base64Image", `data:image/jpeg;base64,${imageBase64}`);

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: process.env.OCR_KEY,
      },
      body: formData,
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro no OCR:", error);
    res.status(500).json({ error: "Erro ao processar imagem" });
  }
});

module.exports = router;
