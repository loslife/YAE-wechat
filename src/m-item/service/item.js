var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var _ = require("underscore");
var request = require("request");

exports.item = item;
exports.itemDetail = itemDetail;

var yaeUrl = "http://121.40.75.73";

function item(req, res, next) {
    var enterpriseId = req.params.enterpriseId;

    //todo replace url
    var queryShelvesUrl = yaeUrl + "/svc/weixin/queryAllShelvesItem/" + enterpriseId;

    var options = {
        method: "GET",
        uri: queryShelvesUrl,
        json: true
    };

    request(options, function (err, response, body) {
        if (err) {
            logger.error({err: err, detail: "调用失败" + queryShelvesUrl});
            next(err);
            return;
        }

        if (body.code != 0) {
            next("调用结果有误");
            return;
        }

        var hotShelvesList = _.sortBy(body.result, function (item) {
            return item.name;
        });

        res.render("item", {enterprise_id: enterpriseId, layout: "layout", menu: "item", shelveList: hotShelvesList});
    });
}

function itemDetail(req, res, next) {
    var enterpriseId = req.params.enterpriseId;
    var itemId = req.params.itemId;

    //todo replace url
    var queryUrl = yaeUrl + "/svc/weixin/queryShelvesByItemId/" + itemId;

    var options = {
        method: "GET",
        uri: queryUrl,
        json: true
    };

    request(options, function (err, response, body) {
        if (err) {
            logger.error({err: err, detail: "调用失败" + queryUrl});
            next(err);
            return;
        }

        if (body.code != 0) {
            next("调用结果有误");
            return;
        }


        if (_.isEmpty(body.result)) {
            next("项目查询失败");
            return;
        }

        var item = body.result[0];

        res.render("itemDetail", {enterprise_id: enterpriseId, layout: "layout", menu: "none", item: item});
    });
}