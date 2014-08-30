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

        var sql = "select a.id as card_id, a.currentMoney, a.modify_date, a.periodOfValidity, a.create_date," +
            " b.name, b.baseInfo_type as type" +
            " from planx_graph.tb_membercard as a, planx_graph.tb_membercardcategory as b " +
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

                    var sql = "select a.value, a.def_int1 as bind_group" +
                        " from planx_graph.tb_membercardattrmap a" +
                        " where a.groupName = 'recordCardBalance' and a.memberCardId = :card_id and a.enterprise_id = :enterprise_id";

                    dbHelper.execSql(sql, {enterprise_id: enterprise_id, card_id: card.card_id}, function(err, result){

                        if(err){
                            next(err);
                            return;
                        }

                        var grouped = _.values(_.groupBy(result, function (item) {
                            return item.bind_group;
                        }));

                        var remaining = 0;

                        _.each(grouped, function (group) {
                            remaining += Number(group[0].value);
                        });

                        card.remainingTimes = remaining;

                        next(null);
                    });

                    return;
                }

                // 年卡
                if(card.type === "quarter"){
                    var millis_of_validity = card.periodOfValidity * 24 * 60 * 60 * 1000;
                    card.expired_time = card.create_date + millis_of_validity;
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

        var sql = "select value as times, def_str3 as serviceName, def_int2 as validDays, create_date" +
            " from planx_graph.tb_memberCardAttrMap" +
            " where groupName = 'presentService' and def_str2 = :member_id and enterprise_id = :enterprise_id";

        dbHelper.execSql(sql, {enterprise_id: enterprise_id, member_id: member_id}, function(err, result){

            if(err){
                callback(err);
                return;
            }

            _.each(result, function(item){

                if(!item.validDays){
                    item.validDays = 365;
                }

                item.expired_time = item.create_date + item.validDays * 24 * 60 * 60 * 1000;
                services.push(item);
            });

            callback(null);
        });
    }

    function _queryDeposits(callback){

        var sql = "select entityName, numberofuse from planx_graph.tb_memberaccessory" +
            " where memberId = :member_id and type = 'depositItem' and enterprise_id = :enterprise_id";

        dbHelper.execSql(sql, {enterprise_id: enterprise_id, member_id: member_id}, function(err, result){

            if(err){
                callback(err);
                return;
            }

            deposits = result;
            callback(null);
        });
    }

    function _queryCoupons(callback){

        var sql = "select def_str3 as name, def_rea2 as money, def_int1 as valid, create_date as dateTime" +
            " from planx_graph.tb_memberCardAttrMap where def_str2 = :member_id and groupName = 'coupon' and enterprise_id = :enterprise_id;";

        dbHelper.execSql(sql, {enterprise_id: enterprise_id, member_id: member_id}, function(err, result){

            if(err){
                callback(err);
                return;
            }

            _.each(result, function(item){

                if(!item.valid){
                    item.valid = 365;
                }

                item.expired_time = item.dateTime + item.valid * 24 * 60 * 60 * 1000;
                coupons.push(item);
            });

            callback(null);
        });
    }
}