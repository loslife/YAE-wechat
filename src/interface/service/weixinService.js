var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var wx = require("wechat-toolkit");
var async = require("async");

var token = "yilos_wechat";

exports.enable_dev_mode = wx.enable_dev_mode(token);
exports.handleWXRequest = handleWXRequest;

function handleWXRequest(req, res, next){

    var flag = wx.validate(req, token);
    if(!flag){
        res.send("validate failure");
        return;
    }

    if(req.weixin.message_type === "text"){
        handleTextMessage();
    }else if(req.weixin.message_type === "event"){
        handleEvent();
    }else{
        res.send("");
    }

    function handleTextMessage(){

        resolveSiteURL(function(err, url, enterprise_id){

            if(err){
                console.log(err);
                wx.replyTextMessage(req, res, "微店铺似乎出了点问题，请联系乐斯");
                return;
            }

            var item = {
                title: "请访问我们的微网站",
                desc: "查看店铺资料，产品和优惠信息",
                picUrl: "http://121.40.75.73/resource/logo.png",
                url: url
            };

            var contents = [item];

            wx.replyNewsMessage(req, res, contents);
        });
    }

    function handleEvent(){

        if(req.weixin.event === "subscribe"){

            wx.replyTextMessage(req, res, "感谢您的关注，我们会为您提供最好的服务");
            return;
        }

        if(req.weixin.event === "CLICK"){

            if(req.weixin.event_key === "WSITE"){

                async.waterfall([resolveSiteURL, resolveMemberId], function(err, url){

                    if(err){
                        console.log(err);
                        wx.replyTextMessage(req, res, "微店铺似乎出了点问题，请联系乐斯");
                        return;
                    }

                    var item = {
                        title: "请访问我们的微网站",
                        desc: "查看店铺资料，产品和优惠信息",
                        picUrl: "http://121.40.75.73/resource/logo.png",
                        url: url
                    };

                    var contents = [item];

                    wx.replyNewsMessage(req, res, contents);
                });

                function resolveMemberId(url, enterprise_id, callback){

                    var fan_open_id = req.weixin.fan_open_id;

                    dbHelper.queryData("weixin_member_binding", {enterprise_id: enterprise_id, wx_open_id: fan_open_id}, function(err, result){

                        if(err){
                            callback(err);
                            return;
                        }

                        if(result.length > 0){
                            url = url + "?m_id=" + result[0].member_id;
                        }

                        callback(null, url);
                    });
                }

            }else if(req.weixin.event_key === "MEMBER_BINDING"){

                resolveSiteURL(function(err, url, enterprise_id){

                    if(err){
                        console.log(err);
                        wx.replyTextMessage(req, res, "微店铺似乎出了点问题，请联系乐斯");
                        return;
                    }

                    var fan_open_id = req.weixin.fan_open_id;

                    dbHelper.queryData("weixin_member_binding", {enterprise_id: enterprise_id, wx_open_id: fan_open_id}, function(err, result){

                        if(err){
                            console.log(err);
                            wx.replyTextMessage(req, res, "微店铺似乎出了点问题，请联系乐斯");
                            return;
                        }

                        if(result.length > 0){
                            wx.replyTextMessage(req, res, "您已经绑定会员，无需重复绑定");
                            return;
                        }

                        var url = "http://121.40.75.73/svc/wsite/" + enterprise_id + "/binding?open_id=" + fan_open_id;

                        var item = {
                            title: "点击绑定",
                            desc: "绑定后即可访问会员专区，查看会员卡余额，预约",
                            picUrl: "http://121.40.75.73/resource/logo.png",
                            url: url
                        };

                        var contents = [item];

                        wx.replyNewsMessage(req, res, contents);
                    });
                });

            }else if(req.weixin.event_key === "MY_CARD"){
                wx.replyTextMessage(req, res, "展示会员卡余额");
            }else{
                wx.replyTextMessage(req, res, "无法识别的点击事件");
            }

            return;
        }

        res.send("");
    }

    function resolveSiteURL(callback){

        var my_open_id = req.weixin.my_open_id;

        dbHelper.queryData("weixin_binding", {weixin_open_id: my_open_id}, function(err, result){

            if(err){
                callback(err);
                return;
            }

            if(result.length === 0){
                callback({message: "未找到关联微店铺"});
                return;
            }

            var enterprise_id = result[0].enterprise_id;

            var url = "http://121.40.75.73/svc/wsite/" + enterprise_id + "/shop";

            callback(null, url, enterprise_id);
        });
    }
}