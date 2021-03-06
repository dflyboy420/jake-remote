const config = require("config");
const HTTP_PORT = config.get("http.port");

const logger = require("./logger");
const Document = require("./document");
const DocumentFile = require("./documentFile");
const DocumentZip = require("./documentZip");

const Compiler = require("./compiler");

const express = require("express");
const basicAuth = require("express-basic-auth");
const multer = require("multer");

const app = express();
var upload = multer({
    dest: "uploads/"
});

var authorize = basicAuth({
    users: config.get("auth.users")
});

app.get("/", (req, res) => {
    // TODO: create default homepage
});

app.post("/document/upload", authorize, upload.array("documents"), async (req, res) => {
    if (req.files.length < 1) return res.status(400).send("no files uploaded");
    if (!req.body.main) return res.status(400).send("no main file specified");

    let document = Document.build({
        mainFile: req.body.main,
        uploader: req.ip
    });

    if(req.body.name) document.name = req.body.name;
    await document.save();

    await document.addFiles(req.files, req.body.main);

    let fileCount = await document.countDocumentFiles();
    let data = {
        id: document.id,
        name: document.name,
        status: document.status,
        fileCount
    };

    return res.json(data);
});

app.get("/document/list", authorize, async (req, res) => {

    let documents = await Document.findAll({
        attributes: ["id", "name", "status", "uploader"]
    });

    return res.json(documents);
});

app.get("/document/:id", async (req, res) => {
    if (!req.params.id) return res.status(400).send("no document specified");

    let document = await Document.findByPk(req.params.id);
    if (!document) return res.sendStatus(400);

    let fileCount = await document.countDocumentFiles();
    let data = {
        id: document.id,
        name: document.name,
        status: document.status,
        uploader: document.uploader,
        fileCount
    };

    return res.json(data);
});

app.get("/document/:id/compile", authorize, async (req, res) => {
    if (!req.params.id) return res.status(400).send("no document specified");

    let document = await Document.findByPk(req.params.id);
    if (!document) return res.sendStatus(400);

    let compiler = new Compiler(document);
    await compiler.compile();

    let fileCount = await document.countDocumentFiles();
    let data = {
        id: document.id,
        name: document.name,
        status: document.status,
        fileCount
    };

    return res.json(data);
});

app.get("/document/:id/files/list", async (req, res) => {
    if (!req.params.id) return res.status(400).send("no document specified");

    let document = await Document.findByPk(req.params.id);
    if (!document) return res.sendStatus(400);

    let files = await document.getDocumentFiles({
        attributes: ["id", "path", "createdAt"]
    });

    return res.json(files);
});

app.get("/document/:id/files/download", async (req, res) => {
    if (!req.params.id) return res.status(400).send("no document specified");
    if (!req.query.pattern) return res.status(400).send("no pattern specified");

    let document = await Document.findByPk(req.params.id);
    if (!document) return res.sendStatus(400);

    let zip = new DocumentZip(document);
    await zip.addFiles(req.query.pattern);
    let data = zip.generate();

    let fileName = (document.name !== null ? document.name : "jake-remote-" + document.id) + ".zip";
    res.contentType("zip").set("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(await data);
});

app.get("/document/:id/files/download/pdf", async (req, res) => {
    if (!req.params.id) return res.status(400).send("no document specified");

    let document = await Document.findByPk(req.params.id);
    if (!document) return res.sendStatus(400);

    let zip = new DocumentZip(document);
    await zip.addFiles("%.pdf");
    let data = zip.generate();

    let fileName = (document.name !== null ? document.name : "jake-remote-" + document.id) + ".zip";
    res.contentType("zip").set("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(await data);
});

app.get("/document/:id/files/download/all", async (req, res) => {
    if (!req.params.id) return res.status(400).send("no document specified");

    let document = await Document.findByPk(req.params.id);
    if (!document) return res.sendStatus(400);

    let zip = new DocumentZip(document);
    await zip.addAllFiles();
    let data = zip.generate();

    let fileName = (document.name !== null ? document.name : "jake-remote-" + document.id) + ".zip";
    res.contentType("zip").set("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(await data);
});

app.get("/file/:id/download", async (req, res) => {
    if (!req.params.id) return res.status(400).send("no file specified");

    let file = await DocumentFile.findByPk(req.params.id);
    if(!file) return res.status(400).send("file id invalid");
    let path = await file.getFullPath();

    return res.sendFile(path);
});


module.exports.start = () => {
    app.listen(HTTP_PORT, () => {
        logger.info("Listening on HTTP port %d", HTTP_PORT);
    });
};