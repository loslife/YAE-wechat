var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var _ = require("underscore");
var async = require("async");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();

exports.jumpToWMember = jumpToWMember;
exports.checkSession = checkSession;
exports.queryMemberCardInfo = queryMemberCardInfo;

function jumpToWMember(req, res, next) {
    var enterprise_id = req.params["enterpriseId"];
    var member_id = "1000086024659001000000000304292";//req.session.member_id;

    queryMemberData(enterprise_id, member_id, function (err, result) {
        if (err) {
            logger.error(enterprise_id + "会员数据查询出错:" + err);
            next("会员数据查询失败");
            return;
        }

        res.render("member", {name: "会员一号", enterprise_id: enterprise_id, menu: "member", memberInfo: _rebuild(result)});
    });

    function _rebuild(memberInfo) {
        _.each(memberInfo.cards, function (card) {
            card.currentConsumeDate = _dateFormat(new Date(card.modify_date), "MM-dd");

            if (card.type === "quarter" && card.expired_time) {
                card.expired_time = _dateFormat(new Date(card.expired_time), "yy-MM-dd");
            }
        });

        _.each(memberInfo.coupons, function (coupon) {
            coupon.expired_time = _dateFormat(new Date(coupon.expired_time), "yy-MM-dd");
        });

        _.each(memberInfo.services, function (service) {
            service.expired_time = _dateFormat(new Date(service.expired_time), "yy-MM-dd");
        });

        _.each(memberInfo.services, function (service) {
            service.expired_time = _dateFormat(new Date(service.expired_time), "yy-MM-dd");
        });

        var billGroups = {};
        var bills = [];
        _.each((memberInfo.rechargeRecords || []).concat(memberInfo.consumptionRecords || []), function (bill) {
            var createDate = new Date(Number(bill.create_date));
            var groupName = createDate.getFullYear() + "/" + (createDate.getMonth() + 1);
            bill.createDay = createDate.getDate();
            if (billGroups[groupName]) {
                billGroups[groupName].push(_buildBillDetail(bill));
            } else {
                billGroups[groupName] = [_buildBillDetail(bill)];
            }
        });
        _.each(billGroups, function (value, key) {
            if (billGroups.hasOwnProperty(key)) {
                var records = _.sortBy(value, function (item) {
                    return -item.createDay;
                });
                bills.push({date: key, records: records});
            }
        });
        bills = _.sortBy(bills, function (item) {
            var date = new Date(item.date);
            return (date.getFullYear() + date.getMonth());
        });
        memberInfo.bills = bills;

        return memberInfo;

        function _dateFormat(date, fmt) {
            var o = {
                "M+": date.getMonth() + 1, //月份
                "d+": date.getDate(), //日
                "h+": date.getHours(), //小时
                "m+": date.getMinutes(), //分
                "s+": date.getSeconds(), //秒
                "q+": Math.floor((date.getMonth() + 3) / 3), //季度
                "S": date.getMilliseconds() //毫秒
            };
            if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o) {
                if (new RegExp("(" + k + ")").test(fmt)) {
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                }
            }
            return fmt;
        }

        function _buildBillDetail(bill) {
            var items = [];
            var type = bill.type;//1、充值；2、开卡；没有表示为收银
            if (!type) {
                _.each(bill.items, function (item) {
                    if (item.project_name && !_.isEmpty(item.project_name)) {
                        items.push(item.project_name);
                    }
                });
            } else {
                items.push(1 == type ? "充值" : "开卡");
            }
            var employees = [];
            _.each(bill.bonus || [], function (item) {
                if (item.employee_name && !_.isEmpty(item.employee_name)) {
                    employees.push(item.employee_name);
                }
            });
            return {createDay: bill.createDay, items: items.toString(), employees: _.isEmpty(employees) ? "无" : employees.toString(), amount: bill.amount};
        }
    }
}

function checkSession(req, res, next) {
    next();
    return;
    var enterprise_id = req.params["enterpriseId"];

    if (req.session && req.session.member_id) {
        next();
        return;
    }

    res.redirect("/svc/wsite/" + enterprise_id + "/login");
}

function queryMemberCardInfo(req, res, next) {
    var enterprise_id = req.params["enterpriseId"];
    var member_id = req.body.member_id;

    queryMemberData(enterprise_id, member_id, function (err, result) {
        if (err) {
            logger.error(enterprise_id + "会员数据查询出错:" + err);
            next(err);
            return;
        }

        doResponse(req, res, result);
    });
}

function queryMemberData(enterprise_id, member_id, callback) {
    var cards = [];
    var services = [];
    var deposits = [];
    var coupons = [];
    var rechargeRecords = [];
    var consumptionRecords = [];

    async.series([_queryCards, _queryServices, _queryDeposits, _queryCoupons, _queryRechargeRecords, _queryConsumptionRecords], function (err) {
        if (err) {
            callback(err);
            return;
        }

        var result = {
            cards: cards,
            services: services,
            deposits: deposits,
            coupons: coupons,
            rechargeRecords: rechargeRecords,
            consumptionRecords: consumptionRecords
        };
        callback(null, result);
    });

    function _queryCards(callback) {

        var sql = "select a.id as card_id, a.cardNo, a.currentMoney, a.modify_date, a.periodOfValidity, a.create_date," +
            " b.name, b.baseInfo_type as type" +
            " from planx_graph.tb_membercard as a, planx_graph.tb_membercardcategory as b " +
            "where a.memberCardCategoryId = b.id and a.memberId = :member_id and a.enterprise_id = :enterprise_id";

        dbHelper.execSql(sql, {enterprise_id: enterprise_id, member_id: member_id}, function (err, result) {

            if (err) {
                callback(err);
                return;
            }

            async.each(result, function (card, next) {

                // 快照日期
                if (!card.modify_date) {
                    card.modify_date = new Date().getTime();
                }

                // 充值卡
                if (!card.type) {
                    card.type = "recharge";
                    next(null);
                    return;
                }

                // 计次卡
                if (card.type === "recordTimeCard") {

                    var sql = "select a.value, a.def_int1 as bind_group" +
                        " from planx_graph.tb_membercardattrmap a" +
                        " where a.groupName = 'recordCardBalance' and a.memberCardId = :card_id and a.enterprise_id = :enterprise_id";

                    dbHelper.execSql(sql, {enterprise_id: enterprise_id, card_id: card.card_id}, function (err, result) {

                        if (err) {
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
                if (card.type === "quarter") {
                    var millis_of_validity = card.periodOfValidity * 24 * 60 * 60 * 1000;
                    card.expired_time = card.create_date + millis_of_validity;
                    next(null);
                    return;
                }

                // 无法识别的卡类型
                next(null);

            }, function (err) {

                if (err) {
                    callback(err);
                    return;
                }

                cards = result;
                callback(null);
            });
        });
    }

    function _queryServices(callback) {

        var sql = "select value as times, def_str3 as serviceName, def_int2 as validDays, create_date" +
            " from planx_graph.tb_memberCardAttrMap" +
            " where groupName = 'presentService' and def_str2 = :member_id and enterprise_id = :enterprise_id";

        dbHelper.execSql(sql, {enterprise_id: enterprise_id, member_id: member_id}, function (err, result) {

            if (err) {
                callback(err);
                return;
            }

            _.each(result, function (item) {

                if (!item.validDays) {
                    item.validDays = 365;
                }

                item.expired_time = item.create_date + item.validDays * 24 * 60 * 60 * 1000;
                services.push(item);
            });

            callback(null);
        });
    }

    function _queryDeposits(callback) {

        var sql = "select entityName, numberofuse from planx_graph.tb_memberaccessory" +
            " where memberId = :member_id and type = 'depositItem' and enterprise_id = :enterprise_id";

        dbHelper.execSql(sql, {enterprise_id: enterprise_id, member_id: member_id}, function (err, result) {

            if (err) {
                callback(err);
                return;
            }

            deposits = result;
            callback(null);
        });
    }

    function _queryCoupons(callback) {

        var sql = "select def_str3 as name, def_rea2 as money, def_int1 as valid, create_date as dateTime" +
            " from planx_graph.tb_memberCardAttrMap where def_str2 = :member_id and groupName = 'coupon' and enterprise_id = :enterprise_id;";

        dbHelper.execSql(sql, {enterprise_id: enterprise_id, member_id: member_id}, function (err, result) {

            if (err) {
                callback(err);
                return;
            }

            _.each(result, function (item) {

                if (!item.valid) {
                    item.valid = 365;
                }

                item.expired_time = item.dateTime + item.valid * 24 * 60 * 60 * 1000;
                coupons.push(item);
            });

            callback(null);
        });
    }

    function _queryRechargeRecords(callback) {
        async.series([_queryRecharges, _queryBonusEmployee], function (error) {
            callback(error);
        });
        function _queryRecharges(callback) {
            dbHelper.queryData("tb_rechargeMemberBill", {member_id: member_id, enterprise_id: enterprise_id}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
                rechargeRecords = result;
                callback(null);
            });
        }

        function _queryBonusEmployee(callback) {
            if (!rechargeRecords && _.isEmpty(rechargeRecords)) {
                callback(null);
                return;
            }
            async.forEachSeries(rechargeRecords, function (item, sub_callback) {
                dbHelper.queryData("tb_empBonus", {serviceBill_id: item.id, enterprise_id: enterprise_id}, function (error, result) {
                    if (error) {
                        sub_callback(error);
                        return;
                    }
                    item.bonus = result;
                    sub_callback(null);
                });
            }, function (error) {
                callback(error);
            });
        }
    }

    function _queryConsumptionRecords(callback) {
        async.series([_queryConsumptions, _queryConsumptionItems, _queryBonusEmployee], function (error) {
            callback(error);
        });

        function _queryConsumptions(callback) {
            dbHelper.queryData("tb_serviceBill", {member_id: member_id, enterprise_id: enterprise_id}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
                consumptionRecords = result;
                callback(null);
            });
        }

        function _queryConsumptionItems(callback) {
            if (!consumptionRecords && _.isEmpty(consumptionRecords)) {
                callback(null);
                return;
            }
            async.forEachSeries(consumptionRecords, function (item, sub_callback) {
                dbHelper.queryData("tb_billProject", {serviceBill_id: item.id, enterprise_id: enterprise_id}, function (error, result) {
                    if (error) {
                        sub_callback(error);
                        return;
                    }
                    item.items = result;
                    sub_callback(null);
                });
            }, function (error) {
                callback(error);
            });
        }

        function _queryBonusEmployee(callback) {
            if (!consumptionRecords && _.isEmpty(consumptionRecords)) {
                callback(null);
                return;
            }
            async.forEachSeries(consumptionRecords, function (item, sub_callback) {
                dbHelper.queryData("tb_empBonus", {serviceBill_id: item.id, enterprise_id: enterprise_id}, function (error, result) {
                    if (error) {
                        sub_callback(error);
                        return;
                    }
                    item.bonus = result;
                    sub_callback(null);
                });
            }, function (error) {
                callback(error);
            });
        }
    }
}