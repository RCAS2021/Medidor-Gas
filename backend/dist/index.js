"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors = require("cors");
const apartmentsRouter = require("./routes/apartments");
const readingsRouter = require("./routes/readings");
const ocrRouter = require("./routes/ocr");
const app = express();
const PORT = 3001;
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/apartments", apartmentsRouter);
app.use("/readings", readingsRouter);
app.use("/ocr", ocrRouter);
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map