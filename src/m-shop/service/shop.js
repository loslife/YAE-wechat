var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var request = require("request");
var _ = require("underscore");
var async = require("async");

var yaeUrl = "http://121.40.75.73";

exports.jumpToWShop = jumpToWShop;

function jumpToWShop(req, res, next) {
    var enterpriseId = req.params.enterpriseId;

    var hotShelvesList = [];
    var wechatSetting = {};
    var store = {};

    async.parallel([_queryHotItem, _queryStoreInfo], function (err) {
        if (err) {
            next(err);
            return;
        }

        res.render("shop", {enterprise_id: enterpriseId, layout: "layout", menu: "store", hotList: hotShelvesList, store: _.extend(store, wechatSetting)});
    });

    function _queryHotItem(callback) {
        //todo replace query
        var queryShelvesUrl = yaeUrl + "/svc/weixin/queryAllShelvesItem/" + enterpriseId;

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

    function _queryStoreInfo(callback) {
        //todo replace query
        var queryUrl = yaeUrl + "/svc/weixin/queryStoreInfo/" + enterpriseId;

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