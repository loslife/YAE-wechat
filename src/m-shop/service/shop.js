var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var request = require("request");
var _ = require("underscore");
var async = require("async");

var http_server = global["_g_clusterConfig"].baseurl;
//var http_server = "http://127.0.0.1:5002/svc";


exports.jumpToWShop = jumpToWShop;

function jumpToWShop(req, res, next) {

    var enterpriseId = req.params.enterpriseId;
    var appId = req.params.appId;
    var single_chain = req.query["store_type"];
    if(single_chain){
        req.session.single_chain = single_chain;
    }else{
        single_chain = req.session.single_chain;
    }

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

            res.render("shop", {app_id: appId, enterprise_id: enterpriseId, layout: "layout", menu: "store", festivals: festivals, hotList: hotShelvesList, store: info, store_type: single_chain});
        });

        function _queryHotItem(callback) {

            var queryShelvesUrl = http_server + "/weixin/queryAllShelvesItem/" + enterpriseId + "?store_type=" + single_chain;

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

            var queryUrl = http_server + "/weixin/queryStoreInfo/" + enterpriseId + "?store_type=" + single_chain;

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