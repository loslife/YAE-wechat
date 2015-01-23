var wx = require("wechat-toolkit");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var async = require("async");
var uuid = require('node-uuid');

var share_app_id = "wxb5243e6a07f2e09a";
var share_app_secret = "06808347d62dd6a1fc33243556c50a5d";
var TABLE_NAME = "weixin_access_token";

exports.getTokenByAppId = getTokenByAppId;
exports.refreshAccessToken = refreshAccessToken;

// callback(err, access_token)
function getTokenByAppId(app_id, callback){

    dbHelper.queryData(TABLE_NAME, {app_id: app_id}, function(err, results){

        if(err){
            callback(err);
            return;
        }

        if(results.length !== 0){
            callback(null, results[0].access_token, results[0].jsapi_ticket, results[0].timestamp);
            return;
        }

        if(app_id === share_app_id){
            generateShare();
        }else{
            generateExclusive();
        }
    });

    function generateShare(){

        wx.getAccessToken(share_app_id, share_app_secret, function(){

            if(arguments[0]){
                callback(arguments[0]);
                return;
            }

            dbHelper.addData(TABLE_NAME, {access_token: arguments[1], app_id: share_app_id, id: uuid.v1()}, function(err){

                if(err){
                    callback(err);
                    return;
                }

                callback(null, arguments[1]);
            });
        });
    }

    function generateExclusive(){

        dbHelper.queryData("weixin_binding", {app_id: app_id}, function(err, results){

            if(err){
                callback(err);
                return;
            }

            if(results.length === 0){
                callback({message: "app_id not found"});
                return;
            }

            wx.getAccessToken(app_id, results[0].app_secret, function(){

                if(arguments[0]){
                    callback(arguments[0]);
                    return;
                }

                dbHelper.addData(TABLE_NAME, {access_token: arguments[1], app_id: app_id, id: uuid.v1()}, function(err){

                    if(err){
                        callback(err);
                        return;
                    }

                    callback(null, arguments[1]);
                });
            });
        });
    }
}

// callback(err, access_token)
function refreshAccessToken(app_id, callback){

    if(app_id === share_app_id){
        refreshShare();
    }else{
        refreshExclusive();
    }

    function refreshShare(){

            wx.getAccessToken(share_app_id, share_app_secret, function(err, access_token, jsapi_ticket){

            if(err){
                callback(err);
                return;
            }
            var timestamp = (new Date().getTime() / 1000).toString();
            dbHelper.update({app_id: share_app_id}, TABLE_NAME, {access_token: access_token, jsapi_ticket: jsapi_ticket, timestamp: timestamp}, function(err) {

                if(err){
                    callback(err);
                    return;
                }

                callback(null, access_token, jsapi_ticket);
            });
        });
    }

    function refreshExclusive(){

        dbHelper.queryData("weixin_binding", {app_id: app_id}, function(err, results){

            if(err){
                callback(err);
                return;
            }

            if(results.length === 0){
                callback({message: "app_id not found"});
                return;
            }

            wx.getAccessToken(app_id, results[0].app_secret, function(err, access_token, jsapi_ticket){

                if(err){
                    callback(err);
                    return;
                }
                var timestamp = (new Date().getTime() / 1000).toString();
                dbHelper.update({app_id: app_id}, TABLE_NAME, {access_token: access_token, jsapi_ticket: jsapi_ticket, timestamp: timestamp}, function(err){

                    if(err){
                        callback(err);
                        return;
                    }

                    callback(null, access_token, jsapi_ticket);
                });
            });
        });
    }
}