const fs = require("fs");
const {
    spawn
} = require("child_process");
const async = require("async");
const path = require("path");
const logger = require("./logger");

class Compiler {
    /**
     * Construct a new JAKE compiler instance
     * @param {string[]} files Array of files as returned by multer
     * @param {string[]} arguments Command line arguments
     * @param {*} id document id
     */
    constructor(files, arguments, id) {
        this.rawFiles = files;
        this.arguments = arguments;
        this.folder = path.normalize(__dirname + "documents/" + id);
        this.files = [];
    }

    async createDocumentFolder() {
        fs.mkdir(this.folder, (err) => {
            if (err) throw err;

            async.each(this.rawFiles, (file, cb) => {
                const dest = this.folder + path.sep + file.originalname;
                fs.copyFile(file.path, dest, (err) => {
                    if (err) cb(err);
                    else {
                        const regex = /^.*\.tex$/;
                        if (regex.test(dest)) this.mainFile = dest;
                        this.files.push(dest);
                        cb();
                    }
                })
            }, (err) => {
                if (err) {
                    throw new Error("Document files couldn't be copied");
                } else {
                    logger.info("Document folder for " + this.id + " was created");
                }
            });
        })
    }

    runJake() {
        return new Promise((resolve, reject) => {
            if (!this.mainFile) throw new Error("no main file detected");
            var args = this.arguments;
            args.push(this.mainFile);
            var jakeInstance = spawn("lilly_jake", this.arguments, {
                cwd: this.folder
            });
            jakeInstance.on("close", (code) => {
                if(code !== 0) {
                    return reject("lilly_jake failed with code %d", code);
                } else {
                    logger.info("Executed lilly_jake successfully on document %d", this.id);
                    return resolve();
                }
            })
        })
    }

    runMake() {
        return new Promise((resolve, reject) => {
            var makeInstance = spawn("make", {
                cwd: this.folder
            });
            makeInstance.on("close", (code) => {
                if(code !== 0) {
                    return reject("make failed with code %d", code);
                } else {
                    logger.info("Executed make successfully on document %d", this.id);
                    return resolve();
                }
            })
        })
    }

}

module.exports = Compiler;