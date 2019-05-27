const Sequelize = require("sequelize");
const path = require("path");

class DocumentFile extends Sequelize.Model {
    async getFullPath() {
        let document = await this.getDocument();
        return path.resolve(document.folder, this.path);
    }
}

module.exports = DocumentFile;
