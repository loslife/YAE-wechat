var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var _ = require("underscore");
var async = require("async");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();

exports.jumpToWMember = jumpToWMember;
exports.checkSession = checkSession;
exports.queryMemberCardInfo = queryMemberCardInfo;
exports.memberBill = memberBill;

function jumpToWMember(req, res, next) {
    var enterprise_id = req.params["enterpriseId"];
    var member_id = req.session.member_id;

    var memberInfo = {};
    async.series([_queryMemberData, _queryMemberBill], function (error) {
        if (error) {
            logger.error(enterprise_id + "会员数据查询出错:" + error);
            next("会员数据查询失败");
            return;
        }
        res.render("member", {enterprise_id: enterprise_id, menu: "member", memberInfo: memberInfo});
    })

    function _queryMemberData(callback) {
        queryMemberData(enterprise_id, member_id, function (err, result) {
            if (err) {
                logger.error(enterprise_id + "会员数据查询出错:" + err);
                callback("会员数据查询失败");
                return;
            }
            memberInfo = _rebuild(result);
            callback(null);
        });
    }

    function _queryMemberBill(callback) {
        queryMemberBill(enterprise_id, member_id, function (err, result) {
            if (err) {
                logger.error(enterprise_id + "，会员（" + member_id + "）消费记录查询出错：" + err);
                callback("会员消费记录查询失败");
                return;
            }
            memberInfo.bill = result;
            callback(null);
        });
    }

    function _rebuild(memberInfo) {
        _.each(memberInfo.cards, function (card) {

            card.currentConsumeDate = new Date(card.modify_date).Format("MM-dd");

            if (card.expired_time) {
                card.expired_time = new Date(card.expired_time).Format("yy-MM-dd");
            }
        });

        _.each(memberInfo.coupons, function (coupon) {
            if(coupon.expired_time){
                coupon.expired_time = new Date(coupon.expired_time).Format("yy-MM-dd");
            }
        });

        _.each(memberInfo.services, function (service) {
            if(service.expired_time){
                service.expired_time = new Date(service.expired_time).Format("yy-MM-dd");
            }
        });

        return memberInfo;
    }
}

function checkSession(req, res, next) {
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

function memberBill(req, res, next) {
    var enterprise_id = req.params["enterpriseId"];
    var member_id = req.session.member_id;
    queryMemberBill(enterprise_id, member_id, function (error, result) {
        if (error) {
            logger.error(enterprise_id + "，会员（" + member_id + "）消费记录查询出错：" + error);
            doResponse(req, res, error);
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

    async.series([_queryCards, _queryServices, _queryDeposits, _queryCoupons], function (err) {
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
                    card.expired_time = card.create_date + card.periodOfValidity * 24 * 60 * 60 * 1000;
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
                        card.expired_time = card.create_date + card.periodOfValidity * 24 * 60 * 60 * 1000;

                        next(null);
                    });

                    return;
                }

                // 年卡
                if (card.type === "quarter") {
                    card.expired_time = card.create_date + card.periodOfValidity * 24 * 60 * 60 * 1000;
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

        async.series([_queryFromPad, _queryFromWechat], callback);

        function _queryFromPad(callback) {

            var sql = "select value as times, def_str3 as serviceName, def_int2 as validDays, create_date" +
                " from planx_graph.tb_memberCardAttrMap" +
                " where groupName = 'presentService' and def_str2 = :member_id and enterprise_id = :enterprise_id and (status is null or status != 0);";

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

        function _queryFromWechat(callback) {

            var conditions = {
                enterprise_id: enterprise_id,
                member_id: member_id,
                present_type: "present",
                state: 0
            };

            dbHelper.queryData("weixin_present_received", conditions, function (err, results) {

                if (err) {
                    callback(err);
                    return;
                }

                _.each(results, function (item) {

                    var service = {};
                    service.serviceName = item.present_name + "（来自优惠活动）";
                    services.push(service);
                });

                callback(null);
            });
        }
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

        async.series([_queryFromPad, _queryFromWechat], callback);

        function _queryFromPad(callback) {

            var sql = "select def_str3 as name, def_rea2 as money, def_int1 as valid, create_date as dateTime" +
                " from planx_graph.tb_memberCardAttrMap" +
                " where def_str2 = :member_id and groupName = 'coupon' and (status is null or status != 0) and enterprise_id = :enterprise_id;";

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

        function _queryFromWechat(callback) {

            var conditions = {
                enterprise_id: enterprise_id,
                member_id: member_id,
                present_type: "coupon",
                state: 0
            };

            dbHelper.queryData("weixin_present_received", conditions, function (err, results) {

                if (err) {
                    callback(err);
                    return;
                }

                async.each(results, function(item, next){

                    var coupon = {};
                    coupon.name = item.present_name + "（来自优惠活动）";

                    dbHelper.queryData("tb_membercardcategory", {id: item.present_id}, function (err, results){

                        if(err){
                            next(err);
                            return;
                        }

                        if(results.length === 0){
                            coupon.money = "未知";
                        }else{
                            coupon.money = results[0].baseInfo_minMoney;
                        }

                        coupons.push(coupon);
                        next(null);
                    });

                }, callback);
            });
        }
    }
}

function queryMemberBill(enterpriseId, memberId, callback) {
    var bill = [];
    if (!memberId || !enterpriseId) {
        callback(null, bill)
        return;
    }
    var rechargeRecords = [];
    var consumptionRecords = [];
    async.series([_queryRechargeRecords, _queryConsumptionRecords, _queryBonus, _buildMemberBill], function (error) {
        if (error) {
            callback(error);
            return;
        }
        callback(null, bill);
    });

    function _queryRechargeRecords(callback) {
        dbHelper.queryData("tb_rechargeMemberBill", {member_id: memberId, enterprise_id: enterpriseId}, function (error, result) {
            if (error) {
                logger.error("查询充值、开卡记录失败，memberId:" + memberId + "，enterpriseId：" + enterpriseId + "，error：" + error);
                callback(error);
                return;
            }
            rechargeRecords = result;
            callback(null);
        });
    }

    function _queryConsumptionRecords(callback) {
        var allItems = [];
        async.series([_queryConsumptions, _queryConsumptionItems, _buildItems], function (error) {
            callback(error);
        });

        function _queryConsumptions(callback) {
            dbHelper.queryData("tb_serviceBill", {member_id: memberId, enterprise_id: enterpriseId}, function (error, result) {
                if (error) {
                    logger.error("查询消费记录，memberId:" + memberId + "，enterpriseId：" + enterpriseId + "，error：" + error);
                    callback(error);
                    return;
                }
                consumptionRecords = result;
                callback(null);
            });
        }

        function _queryConsumptionItems(callback) {
            dbHelper.queryData("tb_billProject", {enterprise_id: enterpriseId}, function (error, result) {
                if (error) {
                    logger.error("查询消费项目失败，enterpriseId：" + enterpriseId + "，error：" + error);
                    callback(error);
                    return;
                }
                allItems = result;
                callback(null);
            });
        }

        function _buildItems(callback) {
            _.each(consumptionRecords || [], function (record) {
                var items = _.filter(allItems || [], function (item) {
                    return item.serviceBill_id == record.id;
                });
                record.items = items || [];
            });
            callback(null);
        }
    }

    function _queryBonus(callback) {
        dbHelper.queryData("tb_empBonus", {enterprise_id: enterpriseId}, function (error, result) {
            if (error) {
                logger.error("查询充值、开卡提成记录失败，enterpriseId：" + enterpriseId + "，error：" + error);
                callback(error);
                return;
            }
            _buildBonus(rechargeRecords, result);
            _buildBonus(consumptionRecords, result);
            callback(null);
        });
    }

    function _buildMemberBill(callback) {

        // 填充消费信息
        _.each((rechargeRecords || []).concat(consumptionRecords || []), function (item) {
            bill.push(_buildBillDetail(item));
        });

        // 按时间排序
        bill = _.sortBy(bill, function (item) {
            return item.date;
        });

        callback(null);

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
            //过滤相同员工
            var bonus = _.groupBy(bill.bonus || [], function (item) {
                return item.employee_id;
            });
            _.each(bonus, function (value, key) {
                if (!_.isEmpty(value)) {
                    var item = value[0];
                    if (item && !_.isEmpty(item.employee_name)) {
                        employees.push(item.employee_name);
                    }
                }
            });
            return {date: bill.create_date, items: items.toString(), employees: _.isEmpty(employees) ? "无" : employees.toString(), amount: bill.amount};
        }
    }

    function _buildBonus(records, allBonus) {
        _.each(records || [], function (record) {
            var bonus = _.filter(allBonus || [], function (item) {
                return item.serviceBill_id == record.id;
            });
            record.bonus = bonus || [];
        });
    }
}