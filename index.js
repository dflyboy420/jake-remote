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
    host: seqConfig.host,
    database: seqConfig.database,
    username: seqConfig.username,
    password: seqConfig.password,
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