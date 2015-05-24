var wx = require("wechat-toolkit");
var exclusive = require("./exclusive_handler");
var share = require("./share_handler");
var reply = require("../../meiguanjia/reply_message");
var async = require("async");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var uuid = require('node-uuid');
var httpHelper = require(FRAMEWORKPATH + "/bus/httpHelper");


var token = "yilos_wechat";
var http_server = global["_g_clusterConfig"].baseurl;

exports.enable_dev_mode = wx.enable_dev_mode(token);
exports.enable_dev_mode_mei = wx.enable_dev_mode(token);
exports.handleWXRequest = handleWXRequest;
exports.handleWXMGJRequest = handleWXMGJRequest;
exports.signin = signin;
exports.redirect = redirect;
exports.queryOrder = queryOrder;
exports.createQrcode = createQrcode;

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
        res.render("signin", {layout: false, open_id: open_id, nouser: "first"});
    });
}

function redirect(req, res, next){
    var open_id = req.body.open_id;
    var account = req.body.phone;
    var url =  "enterprise/account/" + account;

    httpHelper.getResource(url,function(err,body){

        if (err) {
            next(err);
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

                    dbHelper.update({open_id: open_id}, "weixin_store_recharge", model, function(err, results) {
                        if (err) {
                            next(err);
                            return;
                        }

                        res.redirect("http://mp.weixin.qq.com/bizmall/mallshelf?id=&t=mall/list&biz=MzA3NDk0NjUxNg==&shelf_id=1&showwxpaytitle=1#wechat_redirect");
                    });

                }else{
                    var model = {
                        id: uuid.v1(),
                        open_id: open_id,
                        enterprise_id: body.id,
                        account: account
                    };

                    dbHelper.addData("weixin_store_recharge", model, function(err, result) {
                        if (err) {
                            next(err);
                            return;
                        }
                        res.redirect("http://mp.weixin.qq.com/bizmall/mallshelf?id=&t=mall/list&biz=MzA3NDk0NjUxNg==&shelf_id=1&showwxpaytitle=1#wechat_redirect");
                    });
                }
            });

        }else{

            res.render("signin", {layout: false, open_id: open_id, nouser: "nouser"});
        }

    });

}

function queryOrder(req, res, next){
    var order_id = req.query["order_id"];
    var options = {
        "order_id": order_id
    };

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


function createQrcode(req, res, next){
    var qrUrl = "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=";
    var appId = req.body.app_id || "wxd37396c2dc23ba21";
    var secret = req.body.secret || "9600186549bc52bdf0d2d7390b05fd2c";
    var scene_id = req.body.sceneId || 1;
    console.log(scene_id);
    wx.getAccessToken(appId, secret, function(err, access_token){
        if(err){
            return next(err);
        }
        wx.generateEternalQrBySceneStr(access_token, scene_id, function(error, data){
            if(error){
                return next(error);
            }
            qrUrl += data.ticket;
            doResponse(req, res, qrUrl);

        });

    });
}