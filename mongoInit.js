'use strict';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'snitch-db';

const callbackToResolveReject = function (resolve, reject) {
  return (err, result) => {
    if (err) {
      reject(err);
    } else {
      resolve(result);
    }
  }
};

const UserInfoStore = new function () {
  const vm = this;

  vm.init = function() {
    return new Promise(function (resolve, reject) {
      MongoClient.connect(`${ url }/exampleDb`, function (err, client) {
        if (!err) {
          const db = client.db(dbName);
          const userInfoCollection = db.collection('userInfo');
          const userInfoStore = {
            collection: userInfoCollection
          };
          userInfoStore.insertOne = function (document) {
            return new Promise(function (resolve, reject) {
              userInfoStore.collection.insertOne(document, callbackToResolveReject(resolve, reject));
            });
          };
          userInfoStore.findOne = function (query, options) {
            return new Promise(function (resolve, reject) {
              userInfoStore.collection.findOne(query, options, callbackToResolveReject(resolve, reject));
            });
          };
          resolve({
            db: db,
            userInfoStore: userInfoStore
          })
        } else {
          reject(err);
        }
      });
    });
  };
};

module.exports = {
  UserInfoStore: UserInfoStore
};
