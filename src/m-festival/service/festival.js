var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var dao = require("./baseService");
var request = require("request");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();

exports.list = list;
exports.route = route;
exports.getPresent = getPresent;
exports.done = done;
exports.countShareTimes = countShareTimes;

var http_server = global["_g_clusterConfig"].baseurl + "/";//"http://10.171.203.219/svc/";

function list(req, res, next){

    var enterpriseId = req.params["enterpriseId"];

    dbHelper.queryData("weixin_festivals", {enterprise_id: enterpriseId, state: 1}, function(err, result){

        if(err){
            console.log(err);
            next(err);
            return;
        }

        res.render("festivals", {enterprise_id: enterpriseId, menu: "festival", festivals: result});
    });
}

// 1. 散客，跳转到输入手机号的页面，查询优惠券是否已经发完
// 2. 会员，跳转到分享领取的页面，查询好优惠券是否发完，会员是否已经领取过
function route(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var memberId = null;

    if(req.session[enterpriseId]){
        memberId = req.session[enterpriseId].member_id;
    }

    dao.queryFestivalById(enterpriseId, festivalId, function(err, festival){

        if(err){
            next(err);
            return;
        }

        increasePageView();// 增加活动页面访问计数

        dao.reachLimit(enterpriseId, festivalId, function(err, expired){

            _queryStoreInfo(function(err, store){

                if(err){
                    next(err);
                    return;
                }

                if(!memberId){
                    res.render("input", {enterprise_id: enterpriseId, menu: "none", store: store, festival: festival, expired: expired});
                }else{
                    dao.hasProvidePresent(enterpriseId, festivalId, memberId, null, function(err, received){
                        res.render("askForShare", {enterprise_id: enterpriseId, menu: "none", store: store, festival: festival, expired: expired, duplicated: received});
                    });
                }
            });
        });

        function increasePageView(){

            festival.modify_date = new Date().getTime();
            festival.view_count ++;

            dbHelper.updateByID("weixin_festivals", festival, function(err, result){

                if(err){
                    console.log("update view_count fail");
                }
            });
        }

        function _queryStoreInfo(callback) {

            var queryUrl = http_server + "weixin/queryStoreInfo/" + enterpriseId;

            var options = {
                method: "GET",
                uri: queryUrl,
                json: true
            };

            request(options, function (err, response, body){

                if (err || body.code != 0) {
                    logger.error({err: err, detail: "调用失败" + queryUrl});
                    callback(err);
                    return;
                }

                callback(null, body.result.store);
            });
        }
    });
}

// 1表示领取成功，2表示已经领取过
function getPresent(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var phone = req.body.phone;
    var memberId = null;

    if(req.session[enterpriseId]){
        memberId = req.session[enterpriseId].member_id;
    }

    dao.queryFestivalById(enterpriseId, festivalId, function(err, festival){

        if(err){
            next(err);
            return;
        }

        dao.hasProvidePresent(enterpriseId, festivalId, memberId, phone, function(err, received){

            // 不允许重复领取
            if(received){
                doResponse(req, res, {status: 2});
                return;
            }

            dao.providePresent(enterpriseId, festivalId, memberId, phone, function(err){

                if(err){
                    next(err);
                    return;
                }

                doResponse(req, res, {status: 1});
            });
        });
    });
}

function done(req, res, next){

    var type = req.query["type"];
    var enterpriseId = req.params["enterpriseId"];

    var model = {
        enterprise_id: enterpriseId,
        menu: "none",
        type: type
    };

    res.render("done", model);
}

function countShareTimes(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];

    dao.queryFestivalById(enterpriseId, festivalId, function(err, festival){

        festival.modify_date = new Date().getTime();
        festival.share_count ++;

        dbHelper.updateByID("weixin_festivals", festival, function(err, result){

            if(err){
                console.log("update share_count fail");
            }

            doResponse(req, res, {message: "ok"});
        });
    });
}