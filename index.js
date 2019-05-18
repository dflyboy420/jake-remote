const config = require("config");
const HTTP_PORT = config.get("http.port");

const logger = require("./logger");

const express = require("express");
const multer  = require('multer')

const app = express();
var upload = multer({ dest: 'uploads/' });

app.get("/", (req, res) => {
    // TODO: create default homepage
});

app.post("/compile", upload.array("document"), (req, res) => {
    // TODO: make the main meat
});

app.listen(HTTP_PORT, () => {
    logger.info("Listening on HTTP port %d", HTTP_PORT);
})