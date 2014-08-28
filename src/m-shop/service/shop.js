var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var _ = require("underscore");

exports.jumpToWShop = jumpToWShop;

function jumpToWShop(req, res, next) {
//    var enterprise_id = req.params.enterpriseId;
    var enterpriseId = "100067002190500100";

    res.render("shop", {enterprise_id: enterpriseId, layout: "layout", menu: "store"});
}