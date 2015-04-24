var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var chainDbHelper = require(FRAMEWORKPATH + "/utils/ChainDbHelper");
var uuid = require('node-uuid');
var api = require("wechat-toolkit");
var request = require("request");
var async = require("async");
var _ = require("underscore");

var baseurl = global["_g_clusterConfig"].baseurl;
var app_id = "wxb5243e6a07f2e09a";
var app_secret = "06808347d62dd6a1fc33243556c50a5d";
var PARAM_SPLITTER = "___";

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
            next({errorCode: 501, errorMessage: "共享号绑定会员，获取open_id失败"});
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

                var url = baseurl + "/wsite/" + app_id + "/bindingAll";

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

                    var bindings = body.result;

                    if(bindings.length === 0){
                        res.redirect("/svc/wsite/memberNotFound");
                        return;
                    }

                    if(bindings.length === 1){
                        if(bindings[0].master_id){
                            var enterprise_id = bindings[0].master_id;
                            var store_type = "chain";
                        }else{
                            var enterprise_id = bindings[0].enterprise_id;
                            var store_type = "single";
                        }
                        var member_id = bindings[0].member_id;
                        res.redirect("/svc/wsite/" + app_id + "/" + enterprise_id + "/shop?m_id=" + member_id + "&store_type=" + store_type);
                        return;
                    }

                    var enterprises = [];
                    var members = [];

                    _.each(bindings, function(item){
                        if(item.master_id){
                            enterprises.push(item.master_id);
                        }else{
                            enterprises.push(item.enterprise_id);
                        }
                        members.push(item.member_id);
                    });

                    var params = "eid=" + enterprises.join(PARAM_SPLITTER) + "&mid=" + members.join(PARAM_SPLITTER);
                    res.redirect("/svc/wsite/selection?" + params);
                });
            }

            function redirectToBindPage(){
                res.render("inputPhone", {layout: false, type: "multi_binding", open_id: open_id, enterprise_id: "", app_id: app_id});
            }
        });
    });
}

// 根据会员手机号，绑定所有商户
function bindAllEnterpriseByPhone(req, res, next){

    var open_id = req.body.open_id;
    var member_phone = req.body.phone;
    var app_id = req.params["appId"];


    async.waterfall([_removeOldBinding, _queryAllEnterprise, _doBinding], function(err, members){

        if(err){
            console.log(err);
            next(err);
            return;
        }

        var results = [];
        _.each(members, function(item){
            if(item.master_id) {
                results.push({member_id: item.id, enterprise_id: item.enterprise_id, master_id: item.master_id});
            }else{
                results.push({member_id: item.id, enterprise_id: item.enterprise_id});
            }
        });

        doResponse(req, res, results);
    });

    function _removeOldBinding(callback){

        dbHelper.deleteDataByCondition("weixin_member_binding", {wx_open_id: open_id}, function(err, conditions){
            callback(err);
        });
    }

    function _queryAllEnterprise(callback){
        var sql = "select a.* from planx_graph.tb_member as a where a.phoneMobile=:phoneMobile and (a.status is null or a.status != 0)";
        dbHelper.execSql(sql, {phoneMobile: member_phone}, function(err, result){

            if(err){
                callback(err);
                return;
            }else{
                var single_result = result;
                var chain_result = null;
                var sum_result = null;

                chainDbHelper.execSql(sql, {phoneMobile: member_phone}, function(error, results){
                    if(error){
                        callback(error);
                    }else{
                        chain_result = results;
                        sum_result = single_result.concat(chain_result);
                    }
                    callback(null, sum_result);
                });
            }

        });
    }

    function _doBinding(members, callback){

        async.each(members, bind, function(err){

            if(err){
                callback(err);
                return;
            }

            callback(null, members);

        });

        function bind(item, next){
            if(item.master_id){
                var model = {
                    id: uuid.v1(),
                    enterprise_id: item.master_id,
                    member_id: item.id,
                    wx_open_id: open_id,
                    phone: member_phone,
                    app_id: app_id,
                    single_chain: "chain"
                };
            }else{
                var model = {
                    id: uuid.v1(),
                    enterprise_id: item.enterprise_id,
                    member_id: item.id,
                    wx_open_id: open_id,
                    phone: member_phone,
                    app_id: app_id,
                    single_chain: "single"
                };
            }


            dbHelper.addData("weixin_member_binding", model, next);
        }
    }
}