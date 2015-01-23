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
function getTicket(access_token){
    wx.getJsApiTicket(access_token, function(err, ticket){
        if(err){
            return err;
        }
        return ticket;
    });
}

function getTokenByAppId(app_id, callback){
    var now_timestamp = parseInt(new Date().getTime() / 1000).toString();
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

        wx.getAccessToken(share_app_id, share_app_secret, function(err, access_token){

            if(err){
                callback(err);
                return;
            }
            var js_ticket = getTicket(access_token);
            dbHelper.addData(TABLE_NAME, {access_token: access_token, app_id: share_app_id, id: uuid.v1(), jsapi_ticket: js_ticket, timestamp: now_timestamp}, function(err){

                if(err){
                    callback(err);
                    return;
                }

                callback(null, access_token, js_ticket, now_timestamp);
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

            wx.getAccessToken(app_id, results[0].app_secret, function(err, access_token){

                if(err){
                    callback(err);
                    return;
                }
                var js_ticket = getTicket(access_token);
                dbHelper.addData(TABLE_NAME, {access_token: access_token, app_id: app_id, id: uuid.v1(), jsapi_ticket: js_ticket, timestamp: now_timestamp}, function(err){

                    if(err){
                        callback(err);
                        return;
                    }

                    callback(null, access_token, js_ticket, now_timestamp);
                });
            });
        });
    }
}

// callback(err, access_token)
function refreshAccessToken(app_id, callback){
    var now_timestamp = parseInt(new Date().getTime() / 1000).toString();
    if(app_id === share_app_id){
        refreshShare();
    }else{
        refreshExclusive();
    }

    function refreshShare(){

        wx.getAccessToken(share_app_id, share_app_secret, function(err, access_token){

            if(err){
                callback(err);
                return;
            }
            var js_ticket = getTicket(access_token);
            dbHelper.update({app_id: share_app_id}, TABLE_NAME, {access_token: access_token, jsapi_ticket: js_ticket, timestamp: now_timestamp}, function(err) {

                if(err){
                    callback(err);
                    return;
                }

                callback(null, access_token, js_ticket);
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

            wx.getAccessToken(app_id, results[0].app_secret, function(err, access_token){

                if(err){
                    callback(err);
                    return;
                }
                var js_ticket = getTicket(access_token);
                dbHelper.update({app_id: app_id}, TABLE_NAME, {access_token: access_token, jsapi_ticket: js_ticket, timestamp: now_timestamp}, function(err){

                    if(err){
                        callback(err);
                        return;
                    }

                    callback(null, access_token, js_ticket);
                });
            });
        });
    }
}