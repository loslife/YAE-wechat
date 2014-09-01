var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var _ = require("underscore");

exports.jumpToWMember = jumpToWMember;
exports.checkSession = checkSession;

function jumpToWMember(req, res, next) {
    var enterprise_id = req.params.enterpriseId;
    //var member_id = req.session.member_id;
    var membercard = [];

        var memberInfo = {
            "code": 1,
            "result": {
                "cards": [
                    {
                        "card_id": "xxxx",
                        "name": "金卡",
                        "type": "recharge",
                        "current_money": "333",
                        "remaining": 3,
                        "refresh_time": "1409302279545"
                    }
                ],
                "services" : [
                    {},
                    {}
                ],
                "coupons" : [
                    {},
                    {}
                ],
                "deposits" : [
                    {},
                    {}
                ]

            }
        };

        res.render("member", {name: "会员一号", enterprise_id: enterprise_id, menu: "member",memberInfo:memberInfo});
}


function checkSession(req, res, next) {
    var enterprise_id = req.params["enterpriseId"];

    if (req.session && req.session.member_id) {
        next();
        return;
    }

    res.redirect("/svc/wsite/" + enterprise_id + "/login");
}