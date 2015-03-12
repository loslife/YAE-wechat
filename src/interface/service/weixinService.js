var wx = require("wechat-toolkit");
var exclusive = require("./exclusive_handler");
var share = require("./share_handler");
var reply = require("../../meiguanjia/reply_message");
var async = require("async");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var uuid = require('node-uuid');
var request = require("request");


var token = "yilos_wechat";
var http_server = global["_g_clusterConfig"].baseurl;

exports.enable_dev_mode = wx.enable_dev_mode(token);
exports.enable_dev_mode_mei = wx.enable_dev_mode(token);
exports.handleWXRequest = handleWXRequest;
exports.handleWXMGJRequest = handleWXMGJRequest;
exports.signin = signin;
exports.redirect = redirect;

function handleWXRequest(req, res, next){

    var enterprise_id = req.query["e"];

    if(!enterprise_id){
        share.handle(req, res, next);// 乐斯公众号
    }else{
        exclusive.handle(req, res, next);// 专属公众号
    }
}

function handleWXMGJRequest(req, res, next){
    reply.handle(req, res, next);
}

function signin(req, res, next){

    var code = req.query["code"];

    // 非微信OAuth跳转
    if(!code){
        res.send("请通过微信打开此页面");
        return;
    }

    wx.exchangeAccessToken("wxd37396c2dc23ba21", "9600186549bc52bdf0d2d7390b05fd2c", code, function(err, result){

        if(err){
            console.log(err);
            return;
        }

        var open_id = result.openid;
        res.render("signin", {layout: false, open_id: open_id});
    });
}

function redirect(req, res, next){
    var open_id = req.body.open_id;
    var account = req.body.phone;
    var url = http_server + "/enterprise/account/" + phone;
    var options = {
        method: "GET",
        uri: url,
        json: true
    };

    request(options, function(err, response, body){
        if (err) {
            console.log(err);
            return;
        }

        if(body.id){

            var condition = {
                open_id: open_id
            };

            dbHelper.queryData("weixin_store_recharge", condition, function(err, result){
                if(err){
                    next(err);
                    return;
                }

                if(result[0]){
                    var model = {
                        open_id: open_id,
                        enterprise_id: body.id,
                        account: account
                    };

                    dbHelper.update({open_id: open_id}, "weixin_store_recharge", model, next);

                }else{
                    var model = {
                        id: uuid.v1(),
                        open_id: open_id,
                        enterprise_id: body.id,
                        account: account
                    };
                    dbHelper.addData("weixin_store_recharge", model, next);
                }
            });

            res.redirect("http://mp.weixin.qq.com/bizmall/mallshelf?id=&t=mall/list&biz=MzA3NDk0NjUxNg==&shelf_id=1&showwxpaytitle=1#wechat_redirect");
        }

    });

    //async.series([checkAuth, _updateData], function(err){
    //    if(err){
    //        next(err);
    //        return;
    //    }
    //});
    //
    //function checkAuth(callback){
    //
    //}


}

function queryOrder(req, res, next){
    var order_id = req.query["order_id"];
    var options = {
        "order_id": order_id
    }

    wx.getAccessToken("wxd37396c2dc23ba21", "9600186549bc52bdf0d2d7390b05fd2c", function(err, access_token){

        if(err){
            callback(err);
            return;
        }

        wx.getOrderDetail(access_token, options, function(err, order){

            if(err){
                callback(err);
                return;
            }

            doResponse(req, res, order);
        });
    });
}