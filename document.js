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
            let foundMainFile = false;
            fs.mkdir(this.folder, (err) => {
                if (err) return reject(err.message);

                async.each(files, (file, cb) => {
                    const dest = this.folder + path.sep + file.originalname;
                    fs.copyFile(file.path, dest, async (err) => {
                        if (err) cb(err);
                        else {
                            let documentFile = await DocumentFile.create({
                                path: file.originalname
                            });
                            await this.addDocumentFile(documentFile);
                            if(documentFile.path === mainFileName) foundMainFile = true;
                            fs.unlink(file.path, err => {
                                if (err) cb(err);
                                else cb();
                            });
                        }
                    });
                }, (err) => {
                    if (err) {
                        return reject("Document files couldn't be copied");
                    } else {
                        // this.getMainFile().then(mainFile => {
                        if(!foundMainFile) {
                            return reject("Main file wasn't correctly specified");
                        }
                        logger.info("Document folder for " + this.id + " was created");
                        return resolve();
                        // });
                    }
                });
            });
        });
    }

    /**
     * Add new file to doc
     * @param {string} filePath Path relative to document root
     */
    async addNewFile(filePath) {
        let count = await this.countDocumentFiles({
            where: {
                path: filePath
            }
        });

        if(count === 0) {
            logger.info("Found new file %s on document %d", filePath, this.id);

            let documentFile = await DocumentFile.create({
                path: filePath
            });
            await this.addDocumentFile(documentFile);
        }
    }
}

module.exports = Document;