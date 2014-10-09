var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var uuid = require('node-uuid');
var api = require("wechat-toolkit");
var request = require("request");
var async = require("async");

var baseurl = global["_g_clusterConfig"].baseurl;
var app_id = "wxd37396c2dc23ba21";
var app_secret = "9600186549bc52bdf0d2d7390b05fd2c";

exports.shareBind = shareBind;
exports.bindAllEnterpriseByPhone = bindAllEnterpriseByPhone;

// 501: 获取open_id失败
// 500: 数据库访问错误
// 502: 绑定失败
function shareBind(req, res, next){

    var code = req.query["code"];

    // 非微信OAuth跳转
    if(!code){
        res.send("请通过微信打开此页面");
        return;
    }

    // 先通过OAuth机制获取到open_id
    api.exchangeAccessToken(app_id, app_secret, code, function(err, result){

        if(err){
            console.log(err);
            next({errorCode: 501, errorMessage: "获取open_id失败"});
            return;
        }

        var open_id = result.openid;

        dbHelper.queryData("weixin_member_binding", {wx_open_id: open_id}, function(err, result){

            if(err){
                console.log(err);
                next({errorCode: 500, errorMessage: "数据库访问错误"});
                return;
            }

            if(result.length !== 0){
                rebindByPhone();// 曾经绑定过，可以找到手机号，重新绑定
            }else{
                redirectToBindPage();// 没有绑定过，让用户输入手机号
            }

            function rebindByPhone(){

                var phone = result[0].phone;

                var url = baseurl + "/wsite/bindingAll";

                var options = {
                    method: "POST",
                    uri: url,
                    body: {open_id: open_id, phone: phone},
                    json: true
                };

                request(options, function(err, response, body) {

                    if(err){
                        next({errorCode: 502, errorMessage: "绑定失败"});
                        return;
                    }

                    var code = body.code;
                    if(code !== 0){
                        next({errorCode: 502, errorMessage: "绑定失败"});
                        return;
                    }

                    res.send("重新绑定成功");
                });
            }

            function redirectToBindPage(){
                res.send("请输入手机号");
            }
        });
    });
}

// 根据会员手机号，绑定所有商户
function bindAllEnterpriseByPhone(req, res, next){

    var open_id = req.body.open_id;
    var member_phone = req.body.phone;

    async.waterfall([_removeOldBinding, _queryAllEnterprise, _doBinding], function(err){

        if(err){
            console.log(err);
            next(err);
            return;
        }

        res.send({code: 0, message: "ok"});
    });

    function _removeOldBinding(callback){

        dbHelper.deleteDataByCondition("weixin_member_binding", {wx_open_id: open_id}, callback);
    }

    function _queryAllEnterprise(callback){

        dbHelper.queryData("tb_member", {phoneMobile: member_phone}, function(err, result){

            if(err){
                callback(err);
                return;
            }

            callback(null, result);
        });
    }

    function _doBinding(members, callback){

        async.each(members, bind, callback);

        function bind(item, next){

            var model = {
                id: uuid.v1(),
                enterprise_id: item.enterprise_id,
                member_id: item.id,
                wx_open_id: open_id,
                phone: member_phone
            };

            dbHelper.addData("weixin_member_binding", model, next);
        }
    }
}