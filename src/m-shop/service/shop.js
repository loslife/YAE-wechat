var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var _ = require("underscore");

exports.jumpToWShop = jumpToWShop;

function jumpToWShop(req, res, next) {

    var enterprise_id = req.params["enterpriseId"];

    res.render("shop", {enterprise_id: enterprise_id, layout: "layout", menu: "store"});
}