var api = require("wechat-toolkit");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");

var app_id = "wxd37396c2dc23ba21";
var app_secret = "9600186549bc52bdf0d2d7390b05fd2c";

exports.route = route;

// 500: 数据库访问错误
// 501: 获取open_id错误
function route(req, res, next){

    var code = req.query["code"];

    // 非微信OAuth跳转
    if(!code){
        res.send("请通过微信打开此页面");
        return;
    }

    api.exchangeAccessToken(app_id, app_secret, code, function(err, result){

        if(err){
            console.log(err);
            next({errorCode: 501, errorMessage: "获取open_id失败"});
            return;
        }

        var condition = {};
        condition.wx_open_id = result.openid;

        dbHelper.queryData("weixin_member_binding", condition, function(err, result){

            if(err){
                console.log(err);
                next({errorCode: 500, errorMessage:"数据库访问错误"});
                return;
            }

            // 根据此open_id无法判断所属店铺，要求用户输入手机号
            if(result.length === 0){
                res.send("不认识的手机号，请输入手机号");
                return;
            }

            // 找到唯一店铺，进入微店铺首页
            if(result.length === 1){
                var enterprise_id = result[0].enterprise_id;
                var member_id = result[0].member_id;
                res.redirect("../" + enterprise_id + "/shop?m_id=" + member_id);
                return;
            }

            // 多个店铺的情况
            res.send("多个店铺");
        });
    });
}