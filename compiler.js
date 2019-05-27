const fs = require("fs").promises;
const {
    normalize,
    resolve,
    relative
} = require("path");
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
        await this.document.update({
            status: "compiling"
        });
        await this.runJake();
        await this.checkNewFiles("");
    }

    async checkNewFiles(basePath) {
        let path = resolve(this.folder, basePath);
        let files = await fs.readdir(path, {
            withFileTypes: true
        });
        for (let file of files) {
            let filePath = relative(this.folder, path + "/" + file.name);
            if (file.isFile()) {
                await this.document.addNewFile(filePath);
            } else if (file.isDirectory()) {
                await this.checkNewFiles(filePath);
            }
        }
    }

    runJake() {
        return new Promise((resolve, reject) => {
            let mainFile = this.document.mainFile;
            let args = [mainFile];
            var jakeInstance = spawn("lilly_jake", args, {
                cwd: this.folder
            });
            jakeInstance.on("close", async (code) => {
                if (code !== 0) {
                    await this.document.update({
                        status: "failed"
                    });
                    return reject("lilly_jake failed with code %d", code);
                } else {
                    logger.info("Executed lilly_jake successfully on document %d", this.document.id);
                    await this.document.update({
                        status: "done"
                    });
                    return resolve();
                }
            });
        });
    }

}

module.exports = Compiler;