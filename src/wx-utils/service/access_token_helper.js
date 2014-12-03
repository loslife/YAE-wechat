var wx = require("wechat-toolkit");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var async = require("async");

var share_app_id = "wxb5243e6a07f2e09a";
var share_app_secret = "06808347d62dd6a1fc33243556c50a5d";

exports.initAccessToken = initAccessToken;
exports.refreshAccessToken = refreshAccessToken;
exports.getTokenByAppId = getTokenByAppId;

function initAccessToken(app, clusterConfig) {

    async.waterfall([requestAccessToken, insertOrUpdate], function(err){

        if(err){
            console.log("init access token fail");
            console.log(err);
        }
    });

    function requestAccessToken(callback){

        wx.getAccessToken(share_app_id, share_app_secret, function(err, access_token){

            if(err){
                callback(err);
                return;
            }

            callback(null, access_token);
        });
    }

    function insertOrUpdate(access_token, callback){

        dbHelper.queryData("weixin_share_access_token", {}, function(err, results){

            if(err){
                callback(err);
                return;
            }

            if(results.length === 0){
                dbHelper.addData("weixin_share_access_token", {access_token: access_token}, callback);
            }else{
                dbHelper.update({}, "weixin_share_access_token", {access_token: access_token}, callback);
            }
        });
    }
}

// 刷新共享或独占的access_token
// callback(err, access_token)
function refreshAccessToken(app_id, callback){

    if(app_id === "wxb5243e6a07f2e09a"){
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

            dbHelper.update({}, "weixin_share_access_token", {access_token: access_token}, function(err, result) {

                if(err){
                    callback(err);
                    return;
                }

                callback(null, access_token);
            });
        });
    }

    function refreshExclusive(){

        dbHelper.queryData("weixin_binding", {app_id: app_id}, function(err,results){

            if(err){
                callback(err);
                return;
            }

            if(results.length === 0){
                callback({message: "app_id not found"});
                return;
            }

            var model = results[0];

            wx.getAccessToken(app_id, model.app_secret, function(err, access_token){

                if(err){
                    callback(err);
                    return;
                }

                model.access_token = access_token;

                dbHelper.updateByID("weixin_binding", model, function(err){

                    if(err){
                        callback(err);
                        return;
                    }

                    callback(null, access_token);
                });
            });
        });
    }
}

// callback(err, access_token)
function getTokenByAppId(app_id, callback){

    if(app_id === "wxb5243e6a07f2e09a"){

        dbHelper.queryData("weixin_share_access_token", {}, function(err, results){

            if(err){
                callback(err);
                return;
            }

            if(results.length === 0){
                callback({message: "access_token not found"});
                return;
            }

            callback(null, results[0].access_token);
        });

    }else{

        dbHelper.queryData("weixin_binding", {app_id: app_id}, function(err,results){

            if(err){
                callback(err);
                return;
            }

            if(results.length === 0){
                callback({message: "app_id not found"});
                return;
            }

            callback(null, results[0].access_token);
        });
    }
}