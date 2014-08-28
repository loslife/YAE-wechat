var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var _ = require("underscore");

exports.jumpToWMember = jumpToWMember;
exports.checkSession = checkSession;
exports.queryMemberCardInfo = queryMemberCardInfo;

function jumpToWMember(req, res, next) {

    var enterprise_id = req.params.enterpriseId;
    res.render("member", {name: "会员一号", enterprise_id: enterprise_id, menu: "member"});
}

function queryMemberCardInfo(req, res, next){

    var enterprise_id = req.body.enterprise_id;
    var member_id = req.body.member_id;

    console.log(enterprise_id);
    console.log(member_id);

    _response(req, res, 0, {message: "ok"});
}

function checkSession(req, res, next) {

    var enterprise_id = req.params["enterpriseId"];

    if (req.session && req.session.member_id) {
        next();
        return;
    }

    res.redirect("/svc/wsite/" + enterprise_id + "/login");
}

function _response(req, res, code, resultEntity){

    var response = {
        code: code,
        result: resultEntity
    };
    doResponse(req, res, response);
}