/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
//------------------------------------------------------------------------------
// 2일차 5 page  수정 - 로컬 실행용 환경 변수 값 
require('dotenv').config();
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// 2일차 29 page  수정 - 대화 기록을 위한 로그 모듈 추가 
var log = require('./db/log');
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// 2일차 53 page  수정 - 측정을 위한 모듈 실행 코드 추가 
const appInsights = require("applicationinsights");
appInsights.setup(process.env.ApplicationInsightsKey);
appInsights.start();
//------------------------------------------------------------------------------

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
    //------------------------------------------------------------------------------
    // 2일차 32 page  수정 - 대화 기록을 위한 디비 모듈 초기화    
    log.Init(function() {
        console.log('챗봇 로그 디비 초기화 성공');
    });
    //------------------------------------------------------------------------------
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
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
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
// 2일차 6 page  수정 - 로컬 실행용 환경 변수 값 
// var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
if (process.env['AzureWebJobsStorage']) {
    var azureTableClient = new botbuilder_azure.AzureTableClient(
        tableName,
        process.env['AzureWebJobsStorage']);
} else {
    var azureTableClient = new botbuilder_azure.AzureTableClient(
        tableName,
        process.env.AzureWebJobsStorageAccountName,
        process.env.AzureWebJobsStorageAccountKey);
}
//------------------------------------------------------------------------------
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

//------------------------------------------------------------------------------
// 2일차 32 page  수정 - 대화 기록을 위한 디비 모듈 초기화   
// middleware logging
bot.use({
    receive: function (event, next) {
        log.Log(event,() => {})
        next();
    },
    send: function (event, next) {
        log.Log(event,() => {})
        next();
    }
});
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// 2일차 48 page  수정 - LUIS 서비스 연동   
// Create a recognizer that gets intents from LUIS, and add it to the bot
const LuisModelUrl = process.env.LuisURL;
console.log(`connect LUIS ${LuisModelUrl}`);
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// 2일차 13 page  수정 - 대화 다이얼 로그 샘플
// https://docs.microsoft.com/en-us/azure/bot-service/dotnet/bot-builder-dotnet-activities?view=azure-bot-service-3.0
// conversationUpdate 참고
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                //bot.beginDialog(message.address, '/');
            }
        });
    }
});
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// 2일차 48 page  수정 - LUIS 서비스 연동   
// 예) 날씨문의 
// matches 영역에 직접 작성한 intent 명을 입력하시고, 응답 문구를 수정하세요.
bot.dialog('날씨문의Dialog',
    (session) => {
        session.send('오늘 날씨는 온도 O도 습도 O%입니다.');
        session.endDialog();
    }
).triggerAction({
    matches: '날씨문의'
});
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// 2일차 14 page  수정 - 대화 다이얼 로그 샘플
// https://docs.microsoft.com/en-us/azure/bot-service/nodejs/bot-builder-nodejs-dialog-prompt?view=azure-bot-service-3.0
// Send welcome when conversation with bot is started, by initiating the root dialog
//bot.dialog('/', function (session) {
//        session.send('You said ' + session.message.text);
//});
//------------------------------------------------------------------------------
 bot.dialog('/', [
     function (session) {
         // session.send('You said ' + session.message.text);
         session.send('안녕하세요. 날씨 알림 챗봇입니다.');        
         builder.Prompts.text(session, "알고 싶은 지역을 알려주세요.");
     },
     function (session, results) {
         session.userData.location = results.response;
         session.send(`${session.userData.location} 지역이요? 알겠습니다.`);
         builder.Prompts.choice(
             session,
             "오늘 날씨를 알려드릴까요. 주간 날씨를 알려드릴까요", ["오늘날씨", "주간날씨"],
             { listStyle: builder.ListStyle.button });        
     },
     function (session, results) {
         session.userData.weatherType = results.response.entity;
         if (session.userData.weatherType == "오늘날씨") {
             session.send("오늘 날씨는 O도입니다.");
         } else if (session.userData.weatherType == "주간날씨") {
             session.send("주간 날씨는 O요일 O도, O요일 O도, O요일 O도입니다.");
         } else {
             session.send("대화를 종료합니다.");    
             session.endDialog();
         }
     },
 ]);

