const config = require("config");
const HTTP_PORT = config.get("http.port");

const logger = require("./logger");
const Document = require("./document");
const DocumentZip = require("./documentZip");

const Compiler = require("./compiler");

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

    await document.addFiles(req.files, req.body.main);

    res.json(document);
});

app.get("/document/:id", async (req, res) => {
    if (!req.params.id) return res.status(400).send("no document specified");

    let document = await Document.findByPk(req.params.id);
    if(!document) res.sendStatus(400);

    res.json(document);
});

app.get("/document/:id/compile", async (req, res) => {
    if (!req.params.id) return res.status(400).send("no document specified");

    let document = await Document.findByPk(req.params.id);
    if(!document) res.sendStatus(400);

    let compiler = new Compiler(document);
    await compiler.compile();

    res.json(document);
});

app.get("/document/:id/files/list", async (req, res) => {
    if (!req.params.id) return res.status(400).send("no document specified");

    let document = await Document.findByPk(req.params.id);
    if(!document) res.sendStatus(400);

    let files = await document.getDocumentFiles();

    res.json(files);
});

app.get("/document/:id/download", async (req, res) => {
    if (!req.params.id) return res.status(400).send("no document specified");

    let document = await Document.findByPk(req.params.id);
    if(!document) res.sendStatus(400);

    let zip = new DocumentZip(document);
    await zip.addAllFiles();
    let data = zip.generate();

    let fileName = (document.name !==null ? document.name : "jake-remote-"+document.id) + ".zip";
    res.contentType("zip").set("Content-Disposition", `attachment; filename="${fileName}"`);

    res.send(await data);
});


module.exports.start = () => {
    app.listen(HTTP_PORT, () => {
        logger.info("Listening on HTTP port %d", HTTP_PORT);
    });
};