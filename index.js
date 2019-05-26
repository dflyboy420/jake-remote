const config = require("config");
const Sequelize = require("sequelize");

const logger = require("./logger");
const webserver = require("./web");
const Document = require("./document");
const DocumentFile = require("./documentFile");

const sequelize = new Sequelize(config.get("database"));

const BASE_FOLER = __dirname + "/documents";

Document.init({
    name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    compiled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    mainFile: {
        type: Sequelize.STRING,
        allowNull: false
    },
    folder: {
        type: Sequelize.VIRTUAL(Sequelize.STRING),
        get() {
            return BASE_FOLER + "/" + this.getDataValue("id");
        },
    },
}, {
    sequelize,
    modelName: "document"
});

DocumentFile.init({
    // relative to document root
    path: {
        type: Sequelize.STRING,
        allowNull: false
    },
}, {
    sequelize,
    modelName: "documentFile"
});

Document.hasMany(DocumentFile);
DocumentFile.belongsTo(Document);

function startDeamon() {
    sequelize
        .authenticate()
        .then(() => {
            logger.info("Connection has been established successfully.");
            sequelize.sync().then(() => {
                webserver.start();
            });
        })
        .catch(err => {
            logger.error("Unable to connect to the database:", err);
        });
}

startDeamon();