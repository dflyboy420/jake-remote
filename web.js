const config = require("config");
const HTTP_PORT = config.get("http.port");

const logger = require("./logger");
const Document = require("./document");
const DocumentFile = require("./documentFile");

const express = require("express");
const multer = require("multer");

const app = express();
var upload = multer({
    dest: "uploads/"
});

app.get("/", (req, res) => {
    // TODO: create default homepage
});

app.post("/upload", upload.array("documents"), async (req, res) => {
    if (req.files.length < 1) return res.status(400).send("no files uploaded");
    if (!req.body.main) return res.status(400).send("no main file specified");

    let document = await Document.create({
        mainFile: req.body.main
    });

    await document.addFiles(req.files);

    res.sendStatus(200);

});

module.exports.start = () => {
    app.listen(HTTP_PORT, () => {
        logger.info("Listening on HTTP port %d", HTTP_PORT);
    });
};