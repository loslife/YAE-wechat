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
    var app_id = req.params["appId"];
    var member_id = req.session[enterprise_id].member_id;

    var memberInfo = {};
    async.series([_queryMemberData, _queryMemberBill], function (error) {
        if (error) {
            logger.error(enterprise_id + "会员数据查询出错:" + error);
            next("会员数据查询失败");
            return;
        }
        res.render("member", {app_id: app_id, enterprise_id: enterprise_id, menu: "member", memberInfo: memberInfo});
    });

    function _queryMemberData(callback) {

        queryMemberData(enterprise_id, member_id, function(err, result) {

            if (err) {
                logger.error(enterprise_id + "会员数据查询出错:" + err);
                callback("会员数据查询失败");
                return;
            }

            memberInfo = _rebuild();

            callback(null);

            function _rebuild() {

                _.each(result.cards, function (card) {

                    card.currentConsumeDate = new Date(card.modify_date).Format("MM-dd");

                    if (card.expired_time) {
                        card.expired_time = new Date(card.expired_time).Format("yy-MM-dd");
                    }

                    if (card.periodOfValidity === 20000) {
                        card.expired_time = "不限期";
                    }
                });

                _.each(result.coupons, function (coupon) {

                    if(coupon.expired_time){
                        coupon.expired_time = new Date(coupon.expired_time).Format("yy-MM-dd");
                    }
                });

                _.each(result.services, function (service) {

                    if(service.expired_time){
                        service.expired_time = new Date(service.expired_time).Format("yy-MM-dd");
                    }
                });

                return result;
            }
        });
    }

    function _queryMemberBill(callback) {

        queryMemberBill(enterprise_id, member_id, function (err, result) {
            if (err) {
                logger.error(enterprise_id + "，会员（" + member_id + "）消费记录查询出错：" + err);
                callback("会员消费记录查询失败");
                return;
            }

            var sorted = _.sortBy(result, function (item) {
                return -item.date;
            });

            memberInfo.bill = _.first(sorted, 5);// 按时间排序，只显示最近5条
            callback(null);
        });
    }
}

function checkSession(req, res, next) {

    var enterprise_id = req.params["enterpriseId"];
    var app_id = req.params["appId"];

    if (req.session && req.session[enterprise_id] && req.session[enterprise_id].member_id) {
        next();
        return;
    }

    res.redirect("/svc/wsite/" + app_id + "/" + enterprise_id + "/login");
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
    var member_id = req.session[enterprise_id].member_id;
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
    var name = "";

    async.series([_queryBaseinfo, _queryCards, _queryServices, _queryDeposits, _queryCoupons], function (err) {

        if (err) {
            callback(err);
            return;
        }

        var now = new Date().getTime();

        _.each(cards.concat(coupons), function(item){
            item.expired = (item.expired_time < now);
        });

        var result = {
            cards: cards,
            services: services,
            deposits: deposits,
            coupons: coupons,
            name: name
        };
        callback(null, result);
    });

    function _queryBaseinfo(callback){

        dbHelper.queryData("tb_member", {id: member_id, enterprise_id: enterprise_id}, function(err, results) {

            if (err) {
                callback(err);
                return;
            }

            if(results.length === 0){
                name = "会员";
            }else{
                name = results[0].name;
            }

            callback(null);
        });
    }

    function _queryCards(callback) {

        var sql = "select a.id as card_id, a.cardNo, a.currentMoney, a.modify_date, a.periodOfValidity, a.create_date, " +
            "b.name, b.baseInfo_type as type " +
            "from planx_graph.tb_membercard as a, planx_graph.tb_membercardcategory as b " +
            "where a.memberCardCategoryId = b.id and a.memberId = :member_id and a.enterprise_id = :enterprise_id and (a.status is null or a.status != 0)";

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

                    var sql1 = "select b.name as serviceName, a.value, a.def_int1 as bind_group" +
                        " from planx_graph.tb_membercardattrmap a, planx_graph.tb_service b" +
                        " where a.groupName = 'recordCardBalance' and a.memberCardId = :card_id and a.enterprise_id = :enterprise_id and a.keyName = b.id";

                    dbHelper.execSql(sql1, {enterprise_id: enterprise_id, card_id: card.card_id}, function (err, result) {

                        if (err) {
                            next(err);
                            return;
                        }

                        // 统计各项服务剩余次数
                        card.services = [];
                        _.each(result, function(item){
                            card.services.push({name: item.serviceName, count: item.value});
                        });

                        // 统计服务总剩余次数
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

                    var sql2 = "select value from planx_graph.tb_membercardattrmap" +
                        " where groupName = 'quarterCardUsed' and memberCardId = :card_id and enterprise_id = :enterprise_id";

                    dbHelper.execSql(sql2, {enterprise_id: enterprise_id, card_id: card.card_id}, function (err, result) {

                        if (err) {
                            next(err);
                            return;
                        }

                        var totalUsed = 0;

                        _.each(result, function (item) {
                            totalUsed += item.value;
                        });

                        card.total_used = totalUsed;
                        card.expired_time = card.create_date + card.periodOfValidity * 24 * 60 * 60 * 1000;

                        next(null);
                    });

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
                " where groupName = 'presentService' and def_str2 = :member_id and enterprise_id = :enterprise_id and (status is null or status != 0) and value != 0;";

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
                    service.serviceName = item.present_name + "（活动领取）";
                    services.push(service);
                });

                callback(null);
            });
        }
    }

    function _queryDeposits(callback) {

        var sql = "select entityName, numberofuse from planx_graph.tb_memberaccessoryentity" +
            " where memberId = :member_id and enterprise_id = :enterprise_id";

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
                " where def_str2 = :member_id and groupName = 'coupon' and (status is null or status != 0) and enterprise_id = :enterprise_id and value = 'unused';";

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
                    coupon.name = item.present_name + "（活动领取）";

                    dbHelper.queryData("tb_memberCardCategory", {id: item.present_id}, function (err, results){

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
        callback(null, bill);
        return;
    }

    var rechargeRecords = [];
    var consumptionRecords = [];

    async.series([_queryRechargeRecords, _queryConsumptionRecords, _queryBonus, _buildMemberBill], function(error){

        if (error) {
            callback(error);
            return;
        }
        callback(null, bill);
    });

    function _queryRechargeRecords(callback) {

        var sql = "select a.*, b.memberCardCategoryName" +
            " from planx_graph.tb_rechargememberbill a, planx_graph.tb_membercard b" +
            " where a.member_id = :member_id and a.enterprise_id = :enterprise_id and a.memberCard_id = b.id;";

        dbHelper.execSql(sql, {enterprise_id: enterpriseId, member_id: memberId}, function(err, result){

            if (err) {
                logger.error("查询充值、开卡记录失败，memberId:" + memberId + "，enterpriseId：" + enterpriseId + "，error：" + err);
                callback(err);
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

            var sql = "select * from planx_graph.tb_servicebill" +
                " where member_id = :member_id and enterprise_id = :enterprise_id and (status is null or status != 0);";

            dbHelper.execSql(sql, {enterprise_id: enterpriseId, member_id: memberId}, function (err, result) {

                if (err) {
                    logger.error("查询消费记录，memberId:" + memberId + "，enterpriseId：" + enterpriseId + "，error：" + err);
                    callback(err);
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

            _buildBonus();
            callback(null);

            function _buildBonus() {

                _.each(rechargeRecords.concat(consumptionRecords), function(record) {

                    var bonus = _.filter(result || [], function (item) {
                        return item.serviceBill_id == record.id;
                    });

                    record.bonus = bonus || [];
                });
            }
        });
    }

    function _buildMemberBill(callback) {

        // 构造数据
        _.each(rechargeRecords.concat(consumptionRecords), function(item) {
            bill.push(_buildBillDetail(item));
        });

        // 按时间排序
        bill = _.sortBy(bill, function (item) {
            return item.date;
        });

        callback(null);

        function _buildBillDetail(bill) {

            var items = [];

            // 项目名称
            if(!bill.type) {
                _.each(bill.items, function (item) {
                    if (item.project_name && !_.isEmpty(item.project_name)) {
                        items.push(item.project_name);
                    }
                });
            }else if(bill.type === 7 || bill.type === 9 || bill.type === 8 || bill.type === 10 || bill.type == 5){
                items.push(bill.comment);// 赠送服务，优惠活动赠送服务，现金券，优惠活动现金券，注销
            }else{
                items.push(bill.memberCardCategoryName);// 开新卡，充值卡
            }

            // 过滤相同员工
            var employees = [];
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

            var type = "";
            if(!bill.type){
                type = "consume";
            }else if(bill.type === 1){
                type = "recharge";
            }else if(bill.type === 2){
                type = "new";
            }else if(bill.type === 7 || bill.type === 9){
                type = "service";
            }else if(bill.type === 8 || bill.type === 10){
                type = "coupon";
            }else if(bill.type === 5){
                type = "cancel";// 注销
            }else{
                type = "unknown";// 无法识别
            }

            return {date: bill.create_date, items: items.toString(), employees: _.isEmpty(employees) ? "无" : employees.toString(), amount: bill.amount, type: type};
        }
    }
}