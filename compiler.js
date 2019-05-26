const fs = require("fs");
const {
    spawn
} = require("child_process");

const logger = require("./logger");
const Document = require("./document");

class Compiler {
    /**
     * Construct a new JAKE compiler instance
     * @param {Document} lillyDocument Document instance to compile
     */
    constructor(lillyDocument) {
        this.document = lillyDocument;
        this.folder = lillyDocument.folder;
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
                    logger.info("Executed lilly_jake successfully on document %d", this.id);
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