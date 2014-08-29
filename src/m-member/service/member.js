var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var _ = require("underscore");
var async = require("async");

exports.jumpToWMember = jumpToWMember;
exports.checkSession = checkSession;
exports.queryMemberCardInfo = queryMemberCardInfo;

function jumpToWMember(req, res, next) {

    var enterprise_id = req.params["enterpriseId"];
    res.render("member", {name: "会员一号", enterprise_id: enterprise_id, menu: "member"});
}

function checkSession(req, res, next) {

    var enterprise_id = req.params["enterpriseId"];

    if (req.session && req.session.member_id) {
        next();
        return;
    }

    res.redirect("/svc/wsite/" + enterprise_id + "/login");
}

function queryMemberCardInfo(req, res, next){

    var enterprise_id = req.params["enterpriseId"];
    var member_id = req.body.member_id;

    var cards = [];
    var services = [];
    var deposits = [];
    var coupons = [];

    async.series([_queryCards, _queryServices, _queryDeposits, _queryCoupons], function(err){

        if(err){
            console.log(err);
            next(err);
            return;
        }

        var result = {
            cards: cards,
            services: services,
            deposits: deposits,
            coupons: coupons
        }

        doResponse(req, res, result);
    });

    function _queryCards(callback){

        var sql = "select a.id as card_id, a.currentMoney, a.modify_date, b.name, b.baseInfo_type as type from planx_graph.tb_membercard as a, planx_graph.tb_membercardcategory as b " +
            "where a.memberCardCategoryId = b.id and a.memberId = :member_id and a.enterprise_id = :enterprise_id";

        dbHelper.execSql(sql, {enterprise_id: enterprise_id, member_id: member_id}, function(err, result){

            if(err){
                callback(err);
                return;
            }

            async.each(result, function(card, next){

                // 快照日期
                if(!card.modify_date){
                    card.modify_date = new Date().getTime();
                }

                // 充值卡
                if(!card.type){
                    card.type = "recharge";
                    next(null);
                    return;
                }

                // 计次卡
                if(card.type === "recordTimeCard"){
                    card.remain_count = 3;
                    next(null);
                    return;
                }

                // 年卡
                if(card.type === "quarter"){
                    card.expired_time = new Date().getTime();
                    next(null);
                    return;
                }

                // 无法识别的卡类型
                next(null);

            }, function(err){

                if(err){
                    callback(err);
                    return;
                }

                cards = result;
                callback(null);
            });
        });
    }

    function _queryServices(callback){
        services.push({});
        services.push({});
        callback(null);
    }

    function _queryDeposits(callback){
        deposits.push({});
        deposits.push({});
        callback(null);
    }

    function _queryCoupons(callback){
        coupons.push({});
        coupons.push({});
        callback(null);
    }
}