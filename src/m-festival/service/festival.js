var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var dao = require("./baseService");

exports.list = list;
exports.route = route;
exports.getPresent = getPresent;
exports.done = done;

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

// 1. 散客，跳转到输入手机号的页面，已经查询好优惠券是否已经发完
// 2. 会员，如果已经领取过，重定向到领取成功页面
// 3. 会员，如果没有领取过，跳转到分享后领取的页面，已经查询好优惠券是否已经发完
function route(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var memberId = req.session.member_id;

    dao.queryFestivalById(enterpriseId, festivalId, function(err, festival){

        if(err){
            next(err);
            return;
        }

        dao.reachLimit(enterpriseId, festivalId, function(err, expired){

            if(!memberId){
                res.render("input", {enterprise_id: enterpriseId, menu: "festival", festival: festival, expired: expired});
                return;
            }

            dao.hasProvidePresent(enterpriseId, festivalId, memberId, null, function(err, received){

                if(received){
                    res.redirect("/svc/wsite/" + enterpriseId + "/done?duplicate=true");
                }else{
                    res.render("askForShare", {enterprise_id: enterpriseId, menu: "festival", festival: festival, expired: expired});
                }
            });
        });
    });
}

// 1表示领取成功，2表示已经领取过
function getPresent(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var memberId = req.session.member_id;
    var phone = req.body.phone;

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

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var flag = req.query["duplicate"];

    var model = {
        enterprise_id: enterpriseId,
        menu: "festival",
        festival_id: festivalId,
        duplicate: flag
    };

    res.render("done", model);
}