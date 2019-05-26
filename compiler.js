const fs = require("fs");
const { normalize, resolve, relative } = require("path");
const {
    spawn
} = require("child_process");

const logger = require("./logger");
const Document = require("./document");
const DocumentFile = require("./documentFile");

class Compiler {
    /**
     * Construct a new JAKE compiler instance
     * @param {Document} lillyDocument Document instance to compile
     */
    constructor(lillyDocument) {
        this.document = lillyDocument;
        this.folder = lillyDocument.folder;
    }

    async compile() {
        await this.runJake();
        await this.checkNewFiles("");
    }

    checkNewFiles(basePath) {
        return new Promise((res, reject) => {
            let path = resolve(this.folder, basePath);
            fs.readdir(path, {
                withFileTypes: true
            }, async (err, files) => {
                if(err) return reject(err);
                for (let file of files) {
                    let filePath = relative(this.folder, path + "/" + file.name);
                    if(file.isFile()) {
                        await this.document.addNewFile(filePath);
                    } else if(file.isDirectory()) {
                        await this.checkNewFiles(filePath);
                    }
                }
                res();
            });
        });
    }

    runJake() {
        return new Promise((resolve, reject) => {
            let mainFile = this.document.mainFile;
            let args = [mainFile];
            var jakeInstance = spawn("lilly_jake", args, {
                cwd: this.folder
            });
            jakeInstance.on("close", (code) => {
                if (code !== 0) {
                    return reject("lilly_jake failed with code %d", code);
                } else {
                    logger.info("Executed lilly_jake successfully on document %d", this.document.id);
                    this.document.update({
                        compiled: true
                    }).then(() => {
                        return resolve();
                    });
                }
            });
        });
    }

}

module.exports = Compiler;