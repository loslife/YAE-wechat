var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var uuid = require('node-uuid');
var api = require("wechat-toolkit");

exports.bind = bind;
exports.alreadyBinding = alreadyBinding;
exports.bindMember = bindMember;
exports.unbindMember = unbindMember;

function bind(req, res, next){

    var code = req.query["code"];

    var enterpriseId = req.params["enterpriseId"];
    var appId = req.params["appId"];

    // 非微信OAuth跳转
    if(!code){
        res.send("请通过微信打开此页面");
        return;
    }

    dbHelper.queryData("weixin_binding", {app_id: appId}, function(err, result){

        if(err){
            console.log(err);
            next({errorCode: 500, errorMessage: "数据库异常，请联系管理员"});
            return;
        }

        if(result.length === 0){
            next({errorCode: 500, errorMessage: "数据库异常，请联系管理员"});
            return;
        }

        var appSecret = result[0].app_secret;

        api.exchangeAccessToken(appId, appSecret, code, function(err, result){

            if(err){
                console.log(err);
                next({errorCode: 501, errorMessage: "专用号绑定会员，获取open_id失败"});
                return;
            }

            var condition = {};
            condition.wx_open_id = result.openid;

            dbHelper.queryData("weixin_member_binding", condition, function(err, results){

                if(err){
                    console.log(err);
                    next({errorCode: 500, errorMessage: "数据库异常，请联系管理员"});
                    return;
                }

                if(results.length === 0){
                    res.render("inputPhone", {layout: false, type: "single_binding", open_id: result.openid, enterprise_id: enterpriseId, app_id: appId});
                    return;
                }

                dbHelper.queryData("tb_member", {id: results[0].member_id}, function(err, members){

                    if(err){
                        console.log(err);
                        next({errorCode: 500, errorMessage: "数据库异常，请联系管理员"});
                        return;
                    }

                    if(members.length === 0){
                        res.redirect("/svc/wsite/" + appId + "/" + enterpriseId + "/alreadyBinding?member_name=店内会员");
                    }else{
                        res.redirect("/svc/wsite/" + appId + "/" + enterpriseId + "/alreadyBinding?member_name=" + members[0].name);
                    }
                });
            });
        });
    });
}

function alreadyBinding(req, res, next){

    var memberName = req.query["member_name"];
    res.render("alreadyBinding", {layout: false, member_name: memberName});
}

// 500: 数据库访问错误
// 501: 用户不存在
function bindMember(req, res, next){

    var enterprise_id = req.params["enterpriseId"];
    var app_id = req.params["appId"];
    var open_id = req.body.open_id;
    var member_phone = req.body.phone;

    dbHelper.queryData("tb_member", {enterprise_id: enterprise_id, phoneMobile: member_phone}, function(err, result){

        if(err){
            console.log(err);
            next({errorCode: 500, errorMessage:"数据库访问错误"});
            return;
        }

        if(result.length === 0){
            next({errorCode: 501, errorMessage:"用户不存在"});
            return;
        }

        // 只绑定一个会员，没有处理店内同一个手机号有多个会员的情况
        var member = result[0];

        var model = {
            id: uuid.v1(),
            enterprise_id: enterprise_id,
            member_id: member.id,
            wx_open_id: open_id,
            phone: member_phone,
            app_id: app_id
        }

        dbHelper.addData("weixin_member_binding", model, function(err, result){

            if(err){
                console.log(err);
                next({errorCode: 500, errorMessage:"数据库访问错误"});
                return;
            }

            res.send({code: 0, message: "ok", member_id: member.id});
        });
    });
}

// 400：请求参数错误
// 500：数据库访问错误
// 501：绑定不存在
// 502：解除绑定失败
function unbindMember(req, res, next){

    var enterprise_id = req.params["enterpriseId"];
    var open_id = req.body.open_id;

    if(!open_id){
        next({errorCode: 400, errorMessage:"请求参数错误"});
        return;
    }

    var condition = {};
    condition.enterprise_id = enterprise_id;
    condition.wx_open_id = open_id;

    dbHelper.queryData("weixin_member_binding", condition, function(err, result){

        if(err){
            console.log(err);
            next({errorCode: 500, errorMessage:"数据库访问错误"});
            return;
        }

        if(result.length === 0){
            next({errorCode: 501, errorMessage:"绑定关系不存在"});
            return;
        }

        dbHelper.deleteDataByCondition("weixin_member_binding", condition, function(err){
            if(err){
                next({errorCode: 502, errorMessage:"解除绑定失败"});
                return;
            }
            res.send({code: 0, message: "ok"});
        });
    });
}