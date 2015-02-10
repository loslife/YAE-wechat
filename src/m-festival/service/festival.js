var api = require("wechat-toolkit");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var dao = require("./baseService");
var request = require("request");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var tokenHelper = require("../../wx-utils/service/access_token_helper");
var appIdHelper = require("../../wx-utils/service/app_id_helper");
var async = require("async");

exports.list = list;
exports.route = route;
exports.getPresent = getPresent;
exports.doneRoute = doneRoute;
exports.countShareTimes = countShareTimes;
exports.done = done;

var http_server = global["_g_clusterConfig"].baseurl + "/";//"http://10.171.203.219/svc/";

function list(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var appId = req.params["appId"];
    var store_type= req.session.single_chain;

    dbHelper.queryData("weixin_festivals", {enterprise_id: enterpriseId, state: 1}, function(err, result){

        if(err){
            console.log(err);
            next(err);
            return;
        }

        res.render("festivals", {app_id: appId, enterprise_id: enterpriseId, menu: "festival", festivals: result, store_type: store_type});
    });
}

// 1. 散客，跳转到输入手机号的页面，查询优惠券是否已经发完
// 2. 会员，跳转到分享领取的页面，查询好优惠券是否发完，会员是否已经领取过
function route(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var appId = req.params["appId"];
    var memberId = null;
    var single_chain = req.query["store_type"];
    if(single_chain){
        req.session.single_chain = single_chain;
    }

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
                    res.render("input", {enterprise_id: enterpriseId, menu: "none", store: store, festival: festival, expired: expired, app_id: appId, store_type: single_chain});
                }else{
                    dao.hasProvidePresent(enterpriseId, festivalId, memberId, null, function(err, received){
                        res.render("askForShare", {enterprise_id: enterpriseId, menu: "none", store: store, festival: festival, expired: expired, duplicated: received, app_id: appId, store_type: single_chain});
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

            var queryUrl = http_server + "weixin/queryStoreInfo/" + enterpriseId + "?store_type=" + single_chain;

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

// 从微信OAuth跳转到此链接
function doneRoute(req, res, next){

    var type = req.query["state"];
    var code = req.query["code"];

    var enterpriseId = req.params["enterpriseId"];
    var appId = req.params["appId"];
    var single_chain = req.session.single_chain;
    var member_id;

    if(req.session && req.session[enterpriseId]){
        member_id = req.session[enterpriseId].member_id;
    }

    // 非微信OAuth跳转
    if(!code){
        res.send("请通过微信打开此页面");
        return;
    }

    async.waterfall([_resolveApp, _resolveOpenId, _queryFanInfo], function(err, subscribe){

        var isMember = member_id ? "yes" : "no";

        // 如果查询用户身份过程中出错，则视为未关注用户
        if(err){
            console.log(err);
            res.redirect("/svc/wsite/" + appId + "/" + enterpriseId + "/festival/done?type=" + type + "&subscribe=0&isMember=" + isMember);
        }else{
            res.redirect("/svc/wsite/" + appId + "/" + enterpriseId + "/festival/done?type=" + type + "&subscribe=" + subscribe + "&isMember=" + isMember);
        }
    });

    function _resolveApp(callback){
        appIdHelper.getSecretByAppId(appId, callback);
    }

    function _resolveOpenId(app_id, app_secret, callback){

        api.exchangeAccessToken(app_id, app_secret, code, function(err, result){

            if(err){
                callback({errorCode: 501, errorMessage: "领取后跳转，获取open_id失败"});
                return;
            }

            callback(null, result.openid);
        });
    }

    function _queryFanInfo(open_id, callback){

        tokenHelper.getTokenByAppId(appId, function(err, access_token){

            if(err){
                callback({errorCode: 502, errorMessage: "获取access_token失败"});
                return;
            }

            api.getFanInfo(access_token, open_id, function(err, info){

                if(!err){
                    callback(null, info.subscribe);
                    return;
                }

                switch(err.errcode){

                    case 40001:
                    case 42001:

                        tokenHelper.refreshAccessToken(appId, function(err, access_token){

                            if(err){
                                callback({errorCode: 502, errorMessage: "刷新access_token失败"});
                                return;
                            }

                            api.getFanInfo(access_token, open_id, function(err, info){

                                if(err){
                                    callback(err);
                                    return;
                                }

                                callback(null, info.subscribe);
                            });
                        });
                        break;

                    default:
                        callback({code: err.errcode, message: err.errmsg});
                }
            });
        });
    }
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

function done(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var appId = req.params["appId"];

    var type = req.query["type"];
    var subscribe = req.query["subscribe"];
    var isMember = req.query["isMember"];

    var model = {
        enterprise_id: enterpriseId,
        menu: "none",
        type: type,
        subscribe: subscribe,
        isMember: isMember,
        share: appId === "wxb5243e6a07f2e09a",
        app_id: appId
    };

    res.render("done", model);
}