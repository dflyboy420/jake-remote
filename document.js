const Sequelize = require("sequelize");
const DocumentFile = require("./documentFile");

const fs = require("fs");
const async = require("async");
const path = require("path");

const logger = require("./logger");

class Document extends Sequelize.Model {
    /**
     * Add files to document and copy to own folder
     * @param {string[]} files Array of files as returned by multer
     * @param {string} mainFileName Name of main file
     */
    addFiles(files, mainFileName) {
        return new Promise((resolve, reject) => {
            fs.mkdir(this.folder, (err) => {
                if (err) throw err;

                async.each(files, (file, cb) => {
                    const dest = this.folder + path.sep + file.originalname;
                    fs.copyFile(file.path, dest, async (err) => {
                        if (err) cb(err);
                        else {
                            let documentFile = await DocumentFile.create({
                                path: file.originalname
                            });
                            await this.addDocumentFile(documentFile);
                            // if(documentFile.path === mainFileName) await this.setMainFile(documentFile);
                            cb();
                        }
                    });
                }, (err) => {
                    if (err) {
                        reject("Document files couldn't be copied");
                    } else {
                        // this.getMainFile().then(mainFile => {
                        // if(!mainFile) {
                        //     return reject("Main file wasn't correctly specified");
                        // }
                        logger.info("Document folder for " + this.id + " was created");
                        resolve();
                        // });
                    }
                });
            });
        });
    }
}

module.exports = Document;