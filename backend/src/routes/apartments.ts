const express = require("express");
const { pool } = require("../db");
const router = express.Router();

const supabase = require("../../supabase");

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("apartment").select("*").order("number");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req, res) => {
  const { number } = req.body;

  if (!number) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const { data, error } = await supabase.from("apartment").insert([
    {
      number,
    },
  ]);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Apartamento registrado com sucesso", data });
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM apartment WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao deletar apartamento:", err);
    res.status(500).json({ error: "Erro ao deletar apartamento" });
  }
});

module.exports = router;
