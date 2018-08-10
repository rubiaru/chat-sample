/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
//------------------------------------------------------------------------------
// 2일차 6 page  수정 - 로컬 실행용 환경 변수 값 
var config = require('./config');
//------------------------------------------------------------------------------
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
//------------------------------------------------------------------------------
// 2일차 6 page  수정 - 로컬 실행용 환경 변수 값 
// var connector = new builder.ChatConnector({
//    appId: process.env.MicrosoftAppId,
//    appPassword: process.env.MicrosoftAppPassword,
//    openIdMetadata: process.env.BotOpenIdMetadata
//});
//------------------------------------------------------------------------------
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId || config.dev.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword || config.dev.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
//------------------------------------------------------------------------------
// 2일차 7 page  수정 - 로컬 실행용 환경 변수 값 
// var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
if (process.env['AzureWebJobsStorage']) {
    var azureTableClient = new botbuilder_azure.AzureTableClient(
        tableName,
        process.env['AzureWebJobsStorage']);
} else {
    var azureTableClient = new botbuilder_azure.AzureTableClient(
        tableName,
        config.dev.AzureWebJobsStorage.accountName,
        config.dev.AzureWebJobsStorage.accountKey);
}
//------------------------------------------------------------------------------
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

bot.dialog('/', function (session) {
    session.send('You said ' + session.message.text);
});