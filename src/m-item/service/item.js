var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var _ = require("underscore");

exports.item = item;

function item(req, res, next) {
    var enterpriseId = "100067002190500100";

    res.render("item", {enterprise_id: enterpriseId, layout: "layout", menu: "item"});
}