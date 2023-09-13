var db = require("../config/connection");
var collect = require("../config/collection");
const encrypt = require("bcrypt");

module.exports = {
  userSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await encrypt.hash(userData.password, 10);
      db.get()
        .collection(collect.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data.insertedId);
        });
    });
  },

  userLogin: (loginData) => {
    return new Promise(async (resolve, reject) => {
      let userStatus = false;
      let response = {};
      let dbUser = await db
        .get()
        .collection(collect.USER_COLLECTION)
        .findOne({ email: loginData.email });
      if (dbUser) {
        encrypt.compare(loginData.password, dbUser.password).then((status) => {
          if (status) {
            console.log("login success");
            response.user = dbUser;
            response.status = true;
            resolve(response);
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("No user found");
        resolve({ status: false });
      }
    });
  },
};
