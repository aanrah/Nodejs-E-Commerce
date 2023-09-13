/* <**********> <*************> <**************> <*************> <****>
<******> Connection with async/await and with best practice <******>
<**********> <*************> <**************> <*************> <****>
 */

const { MongoClient } = require("mongodb");

const state = {
  db: null,
};

module.exports.connect = async function () {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const dbname = process.env.MONGODB_DB_NAME || "shopping";

    const client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    state.db = client.db(dbname);

    // Optionally, you can handle events when the connection is closed or lost.
    // client.on("close", () => console.log("MongoDB connection closed."));
    // client.on("reconnect", () => console.log("MongoDB connection reestablished."));

    console.log("Connected to MongoDB.");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    throw err;
  }
};

module.exports.get = function () {
  if (!state.db) {
    throw new Error(
      "Database connection has not been established. Call connect() first."
    );
  }
  return state.db;
};

module.exports.close = async function () {
  if (state.db) {
    await state.db.close();
    state.db = null;
    console.log("MongoDB connection closed.");
  }
};

/* const mongoClient = require("mongodb").MongoClient;

const state = {
  db: null,
};

module.exports.connect = function (done) {
  const uri = "mongodb://localhost:27017";
  const dbname = "shopping";

  mongoClient.connect(uri, (err, data) => {
    if (err) return done(err);
    state.db = data.db(dbname);
    done();
  });
};

module.exports.get = function () {
  return state.db;
}; */
