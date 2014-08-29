var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var _ = require("underscore");

exports.item = item;
exports.itemDetail = itemDetail;

function item(req, res, next) {

    var enterprise_id = req.params["enterpriseId"];
    res.render("item", {enterprise_id: enterprise_id, layout: "layout", menu: "item"});
}

function itemDetail(req, res, next) {

    var enterprise_id = req.params["enterpriseId"];
    res.render("itemDetail", {enterprise_id: enterprise_id, layout: "layout", menu: "none"});
}