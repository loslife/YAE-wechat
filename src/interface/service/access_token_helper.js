var wx = require("wechat-toolkit");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var async = require("async");

var app_id = "wxb5243e6a07f2e09a";
var app_secret = "06808347d62dd6a1fc33243556c50a5d";

exports.initAccessToken = initAccessToken;
exports.refreshAccessToken = refreshAccessToken;
exports.getShareAccessToken = getShareAccessToken;

function initAccessToken(app, clusterConfig) {

    async.waterfall([requestAccessToken, insertOrUpdate], function(err){

        if(err){
            console.log("init access token fail");
            console.log(err);
        }
    });

    function requestAccessToken(callback){

        wx.getAccessToken(app_id, app_secret, function(err, access_token){

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

// 刷新商户的access_token
// 如果enterprise_id未绑定，则更新共享服务号的access_token；否则更新独占服务号的access_token
// callback(err, access_token)
function refreshAccessToken(enterprise_id, callback){

    async.waterfall([_resolveType, _save], function(err, access_token){

        if(err){
            console.log("refresh access token fail");
            console.log(err);
            return;
        }

        callback(null, access_token);
    });

    function _resolveType(callback){

        dbHelper.queryData("weixin_binding", {enterprise_id: enterprise_id}, function(err,results){

            if(err){
                callback(err);
                return;
            }

            callback(null, results);
        });
    }

    function _save(results, callback){

        if(results.length === 0){
            refreshShare();
        }else{
            refreshExclusive();
        }

        function refreshShare(){

            wx.getAccessToken(app_id, app_secret, function(err, access_token){

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

            var model = results[0];
            var self_app_id = model.app_id;
            var self_aap_secret = model.app_secret;

            wx.getAccessToken(self_app_id, self_aap_secret, function(err, access_token){

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
        }
    }
}

// callback(err, access_token)
function getShareAccessToken(callback){

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
}