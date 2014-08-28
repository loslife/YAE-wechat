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

    dbHelper.queryData("tb_member", {enterprise_id: enterprise_id, id: member_id}, function(err, result){

        if(err){
            _response(req, res, 1, {errorMessage: "数据库异常"});
            return;
        }

        if(result.length === 0){
            _response(req, res, 1, {errorMessage: "会员不存在"});
            return;
        }

        var cards = [];
        cards.push({name: "金卡", money: 232});
        cards.push({name: "钻石卡", money: 1944});
        cards.push({name: "美丽一夏卡", money: 2000});
        _response(req, res, 0, cards);
    });
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