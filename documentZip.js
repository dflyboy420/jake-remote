const JSZip = require("jszip");
const fs = require("fs").promises;
const path = require("path");

class DocumentZip {
    /**
     * Construct a new JAKE compiler instance
     * @param {Document} lillyDocument Document instance to compile
     */
    constructor(lillyDocument) {
        this.document = lillyDocument;
        this.folder = lillyDocument.folder;
        this.zip = new JSZip();
    }

    async addFile(fileId) {
        let file;
        if (typeof fileId === "number") {
            let files = await this.document.getDocumentFiles({
                where: {
                    id: fileId
                }
            });
            if (files.length === 1) file = files[0];
        } else if (typeof fileId === "string") {
            let files = await this.document.getDocumentFiles({
                where: {
                    path: fileId
                }
            });
            if (files.length === 1) file = files[0];
        }

        if(!file) throw new Error("File not found");
        let filePath = path.resolve(this.document.folder, file.path);
        let data = await fs.readFile(filePath);
        this.zip.file(file.path, data);
    }

    async addAllFiles() {
        let files = await this.document.getDocumentFiles();
        for(let file of files) {
            let filePath = path.resolve(this.document.folder, file.path);
            let data = await fs.readFile(filePath);
            this.zip.file(file.path, data);
        }
    }

    async generate() {
        return this.zip.generateAsync({type: "nodebuffer"});
    }
}

module.exports = DocumentZip;