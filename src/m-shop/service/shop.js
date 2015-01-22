var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var request = require("request");
var _ = require("underscore");
var async = require("async");
var jsSHA=require("jssha");
var tokenHelper = require("../../wx-utils/service/access_token_helper");

var http_server = global["_g_clusterConfig"].baseurl;

exports.jumpToWShop = jumpToWShop;
exports.signature=signature;

function signature(req,res,next){
    var js_ticket=null;
    var raw = function (args) {
        var keys = Object.keys(args);
        keys = keys.sort()
        var newArgs = {};
        keys.forEach(function (key) {
            newArgs[key.toLowerCase()] = args[key];
        });

        var string = '';
        for (var k in newArgs) {
            string += '&' + k + '=' + newArgs[k];
        }
        string = string.substr(1);
        return string;
    };
    tokenHelper.refreshAccessToken(appId, function(err, access_token){
        var url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=_" + access_token + "&type=jsapi";

        var options = {
            method: "GET",
            dataType: "json"
        };
        urllib.request(url, options, function(err, body, resp){

            if(err){
                callback(err);
                return;
            }

            if(body.errcode){
                callback(body);
                return;
            }

            js_ticket=body.ticket;
        });
    });
    var ret = {
        jsapi_ticket: js_ticket,
        nonceStr: "q2XFkAiqofKmi1Y2",
        timestamp: 1421670369,
        url: req.body.url
    };
    var string = raw(ret);
    var shaObj = new jsSHA(string, 'TEXT');
    var sign = shaObj.getHash('SHA-1', 'HEX');

    res.send({sign:sign});
}

function jumpToWShop(req, res, next) {

    var enterpriseId = req.params.enterpriseId;
    var appId = req.params.appId;

    dbHelper.queryData("weixin_setting", {enterprise_id: enterpriseId}, function(err, result){

        if(err){
            next(err);
            return;
        }

        if(result.length === 0){
            res.render("shop_unavailable", {layout: false});
            return;
        }

        if(result[0].state === 0){
            res.render("shop_unavailable", {layout: false});
            return;
        }

        var festivals = [];
        var hotShelvesList = [];
        var wechatSetting = {};
        var store = {};

        async.parallel([_queryHotItem, _queryFestivals, _queryStoreInfo], function (err) {

            if (err) {
                next(err);
                return;
            }

            var info = _.extend(store, wechatSetting);
            info.name = info.name || "未命名店铺";
            info.phone = info.phone || "";
            info.workHour = info.workHour || "";
            info.addr = info.addr || "";
            info.comment = info.addr || "老板还没有写店铺介绍噢";
            info.logUrl = info.logUrl || "/svc/public/wechat/enterprise_default.png";

            res.render("shop", {app_id: appId, enterprise_id: enterpriseId, layout: "layout", menu: "store", festivals: festivals, hotList: hotShelvesList, store: info});
        });

        function _queryHotItem(callback) {

            var queryShelvesUrl = http_server + "/weixin/queryAllShelvesItem/" + enterpriseId;

            var options = {
                method: "GET",
                uri: queryShelvesUrl,
                json: true
            };

            request(options, function (err, response, body) {
                if (err || body.code != 0) {
                    logger.error({err: err, detail: "调用失败" + queryShelvesUrl});
                    callback(err);
                    return;
                }


                hotShelvesList = _.filter(body.result, function (item) {
                    return item.hot == 1;
                });

                hotShelvesList = _.sortBy(hotShelvesList, function (item) {
                    return item.name;
                });

                hotShelvesList.splice(6);

                callback(null);
            });
        }

        function _queryFestivals(callback) {

            var queryFestivalsUrl = http_server + "/weixin/queryFestivals/" + enterpriseId;

            var options = {
                method: "GET",
                uri: queryFestivalsUrl,
                json: true
            };
            request(options, function (err, response, body) {
                if (err || body.code != 0) {
                    logger.error({err: err, detail: "调用失败" + queryFestivalsUrl});
                    callback(err);
                    return;
                }
                festivals = _.filter(body.result, function (item) {
                    return item.promote == 1 && item.state == 1;
                });
                festivals = _.sortBy(festivals, function (item) {
                    return -item.modify_date;
                });
                festivals.splice(4);
                callback(null);
            });
        }

        function _queryStoreInfo(callback) {

            var queryUrl = http_server + "/weixin/queryStoreInfo/" + enterpriseId;

            var options = {
                method: "GET",
                uri: queryUrl,
                json: true
            };

            request(options, function (err, response, body) {
                if (err || body.code != 0) {
                    logger.error({err: err, detail: "调用失败" + queryUrl});
                    callback(err);
                    return;
                }

                wechatSetting = body.result.setting;
                store = body.result.store;
                callback(null);
            });
        }
    });
}