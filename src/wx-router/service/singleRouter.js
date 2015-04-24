var api = require("wechat-toolkit");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");

exports.singleRoute = singleRoute;

function singleRoute(req, res, next){

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
                next({errorCode: 501, errorMessage: "专用号跳转首页，获取open_id失败"});
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
                    res.redirect("/svc/wsite/" + appId + "/" + enterpriseId + "/shop");
                }else{
                    res.redirect("/svc/wsite/" + appId + "/" + enterpriseId + "/shop?m_id=" + results[0].member_id);
                }
            });
        });
    });
}