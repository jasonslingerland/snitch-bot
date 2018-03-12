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
  let vm = this;

  vm.init = function() {
    return new Promise(function (resolve, reject) {
      MongoClient.connect("mongodb://localhost:27017/exampleDb", function (err, client) {
        if (!err) {
          vm.db = client.db('snitch-db');
          vm.collection = vm.db.collection('userInfo');
          vm.insertOne = function (document) {
            return new Promise(function (resolve, reject) {
              vm.collection.insertOne(document, callbackToResolveReject(resolve, reject));
            });
          };
          vm.findOne = function (query, options) {
            return new Promise(function (resolve, reject) {
              vm.collection.findOne(query, options, callbackToResolveReject(resolve, reject));
            });
          };
          resolve(vm);
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
