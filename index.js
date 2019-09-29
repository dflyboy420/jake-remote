const config = require("config");
const Sequelize = require("sequelize");

const logger = require("./logger");
const webserver = require("./web");
const Document = require("./document");
const DocumentFile = require("./documentFile");

function sqlLog(str) {
    logger.verbose(str);
}

const seqConfig = config.get("database");

var sequelize = new Sequelize({
    storage: seqConfig.storage,
    dialect: seqConfig.dialect,
    define: seqConfig.define,
    logging: sqlLog
});

const BASE_FOLER = __dirname + "/documents";

Document.init({
    name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    status: {
        type: Sequelize.ENUM("pending", "compiling", "done", "failed"),
        defaultValue: "pending"
    },
    mainFile: {
        type: Sequelize.STRING,
        allowNull: false
    },
    uploader: {
        type: Sequelize.STRING(40),
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

// Document.hasOne(DocumentFile, { as: "mainFile" });
Document.hasMany(DocumentFile);
DocumentFile.belongsTo(Document);

async function startDeamon() {
    try {
        await sequelize.authenticate();
        logger.info("Connection has been established successfully.");
        await sequelize.sync({
            force: (process.argv[2] === "reset")
        });
        webserver.start();
    } catch (err) {
        logger.error("Unable to connect to the database:", err);
    }
}

startDeamon();