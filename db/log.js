var mongoClient = require("mongodb").MongoClient;
var assert = require('assert');
var objectId = require('mongodb').ObjectID;
var cosmosDB;
var config = require('../config');

var username = encodeURIComponent(config.dev.CosmosDB.userName);
var password = encodeURIComponent(config.dev.CosmosDB.password);
var cosmosHost = config.dev.CosmosDB.host;
var cosmosPort = config.dev.CosmosDB.port;
var connectString = `${cosmosHost}:${cosmosPort}/${config.dev.CosmosDB.name}?ssl=true&replicaSet=globaldb`;
var url = 'mongodb://';
url += username;
url += ':' + password;
url += '@' + connectString;

var chatlogDb = config.dev.CosmosDB.db;
var logCollection = config.dev.CosmosDB.logCollection;

function Init(callback) {    
    mongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        assert.equal(null, err);
        cosmosDB = client.db(chatlogDb);    
        callback();
    });
}

function Log(log, callback) {    
    cosmosDB.collection(logCollection).insertOne(
        { 
            log,
        }, 
        function (err, result) {            
            if(err)
            {
                console.log(`${logCollection} 컬렉션에 로그 입력 실패`);
                callback();
            }else {                
                callback();
            }
        });
}

exports.Init = Init;
exports.Log = Log;