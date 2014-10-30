var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var request = require("request");
var _ = require("underscore");
var async = require("async");

var http_server = global["_g_clusterConfig"].baseurl;

exports.jumpToWShop = jumpToWShop;

function jumpToWShop(req, res, next) {
    var enterpriseId = req.params.enterpriseId;

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

        res.render("shop", {enterprise_id: enterpriseId, layout: "layout", menu: "store", festivals: festivals, hotList: hotShelvesList, store: info});
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
}