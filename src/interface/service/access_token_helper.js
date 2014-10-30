var wx = require("wechat-toolkit");

var app_id = "wxb5243e6a07f2e09a";
var app_secret = "06808347d62dd6a1fc33243556c50a5d";

exports.initAccessToken = initAccessToken;
exports.refreshAccessToken = refreshAccessToken;

function initAccessToken(app, clusterConfig) {

    wx.getAccessToken(app_id, app_secret, function(err, access_token){

        if(err){
            console.log("request access_token fail");
            console.log(err);
            return;
        }

        global.wx_access_token = access_token;
    });
}

function refreshAccessToken(callback){

    wx.getAccessToken(app_id, app_secret, function(err, access_token){

        if(err){
            console.log("request access_token fail");
            console.log(err);
            callback(err);
            return;
        }

        global.wx_access_token = access_token;
        callback(null);
    });
}