const express = require("express");
const router = express.Router();
const supabase = require("../../supabase");
const { DateTime } = require('luxon');

router.get("/", async (req, res) => {
  const apartmentId = req.query.apartmentId;

  let query = supabase
    .from("reading")
    .select("*, apartment:apartment_id")
    .order("recorded_at", { ascending: false });

  if (apartmentId) {
    query = query.eq("apartment_id", apartmentId);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

router.post("/", async (req, res) => {
  const { apartment_id, display_string, note, recorded_at } = req.body;
  if (!apartment_id || !display_string) {
      return res.status(400).json({ error: "Dados inválidos" });
  }

  let dateToInsert;
  if (recorded_at) {
      dateToInsert = recorded_at;
  } else {
      dateToInsert = DateTime.now().setZone('America/Sao_Paulo').toISO();
  }

  const { data, error } = await supabase.from("reading").insert([
      {
          apartment_id,
          display_string,
          note,
          recorded_at: dateToInsert,
      },
  ]);

  if (error)
      return res.status(500).json({ error: error.message });
  res.json({ message: "Leitura registrada com sucesso", data });
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("reading")
      .delete()
      .eq("id", id)
      .select();

    if (error) return res.status(500).json({ error: error.message });

    if (!data || data.length === 0)
      return res.status(404).json({ error: "Leitura não encontrada" });

    res.json({ success: true, message: "Leitura deletada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro inesperado ao deletar leitura" });
  }
});

module.exports = router;