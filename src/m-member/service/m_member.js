var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var _ = require("underscore");

exports.jumpToWMember = jumpToWMember;

function jumpToWMember(req, res, next){

    var enterprise_id = req.params["enterpriseId"];

    res.render("m_member", {name: "会员一号", enterprise_id: enterprise_id});
}