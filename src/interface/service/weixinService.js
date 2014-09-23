var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var wx = require("wechat-toolkit");
var async = require("async");
var request = require("request");
var _ = require("underscore");

var token = "yilos_wechat";
var server_address = "http://121.40.75.73/";
var default_welcome = "感谢您的关注，我们会为您提供最好的服务";
var error_message = "微店铺似乎出了点问题，请联系乐斯";

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

        resolveSiteURL(function(err, url){

            if(err){
                console.log(err);
                wx.replyTextMessage(req, res, error_message);
                return;
            }

            var item = {
                title: "请访问我们的微网站",
                desc: "查看店铺资料，产品和优惠信息",
                picUrl: server_address + "resource/logo.jpg",
                url: url
            };

            var contents = [item];

            wx.replyNewsMessage(req, res, contents);
        });
    }

    function handleEvent(){

        if(req.weixin.event === "subscribe"){

            async.waterfall([resolveSiteURL, resolveWelcomeWord], function(err, welcome_word){

                if(err){
                    console.log(err);
                    wx.replyTextMessage(req, res, default_welcome);
                    return;
                }

                wx.replyTextMessage(req, res, welcome_word);
            });

            return;

            function resolveWelcomeWord(url, enterprise_id, callback){

                dbHelper.queryData("weixin_setting", {enterprise_id: enterprise_id}, function(err, result){

                    if(err){
                        callback(err);
                        return;
                    }

                    if(result.length === 0){
                        callback(null, default_welcome);
                        return;
                    }

                    var sentence = result[0].welcomeWord;
                    if(!sentence || sentence === ""){
                        callback(null, default_welcome);
                    }else{
                        callback(null, sentence);
                    }
                });
            }
        }

        if(req.weixin.event === "CLICK"){

            if(req.weixin.event_key === "WSITE"){

                async.waterfall([resolveSiteURL, resolveMemberId], function(err, url){

                    if(err){
                        console.log(err);
                        wx.replyTextMessage(req, res, error_message);
                        return;
                    }

                    var item = {
                        title: "请访问我们的微网站",
                        desc: "查看店铺资料，产品和优惠信息",
                        picUrl: server_address + "resource/logo.jpg",
                        url: url
                    };

                    var contents = [item];

                    wx.replyNewsMessage(req, res, contents);
                });

            }else if(req.weixin.event_key === "MEMBER_BINDING"){

                async.waterfall([resolveSiteURL, hasMemberBinding], function(err, flag, enterprise_id, member_id){

                    if(err){
                        console.log(err);
                        wx.replyTextMessage(req, res, error_message);
                        return;
                    }

                    if(flag){
                        wx.replyTextMessage(req, res, "您已经绑定会员，无需重复绑定");
                        return;
                    }

                    var fan_open_id = req.weixin.fan_open_id;

                    var url = server_address + "svc/wsite/" + enterprise_id + "/binding?open_id=" + fan_open_id;

                    var item = {
                        title: "点击绑定",
                        desc: "绑定后即可访问会员专区，查看会员卡余额，预约",
                        picUrl: server_address + "resource/news2.png",
                        url: url
                    };

                    var contents = [item];

                    wx.replyNewsMessage(req, res, contents);
                });

            }else if(req.weixin.event_key === "MEMBER_UNBIND"){

                resolveSiteURL(function(err, url, enterprise_id){

                    if(err){
                        wx.replyTextMessage(req, res, error_message);
                        return;
                    }

                    var cardService = server_address + "svc/wsite/" + enterprise_id + "/unbind";

                    var options = {
                        method: "POST",
                        uri: cardService,
                        body: {open_id: req.weixin.fan_open_id},
                        json: true
                    };

                    request(options, function(err, response, body) {

                        if(err){
                            console.log(err);
                            wx.replyTextMessage(req, res, error_message);
                            return;
                        }

                        var code = body.code;
                        if(code !== 0){
                            var errorCode = body.error.errorCode;
                            if(errorCode === 501){
                                wx.replyTextMessage(req, res, "您尚未绑定会员，无法解除");
                            }else{
                                wx.replyTextMessage(req, res, error_message);
                            }
                            return;
                        }

                        wx.replyTextMessage(req, res, "解除绑定成功");
                    });
                });

            }else if(req.weixin.event_key === "MY_CARD"){

                async.waterfall([resolveSiteURL, hasMemberBinding], function(err, flag, enterprise_id, member_id){

                    if(err){
                        console.log(err);
                        wx.replyTextMessage(req, res, error_message);
                        return;
                    }

                    if(!flag){

                        var fan_open_id = req.weixin.fan_open_id;

                        var url = server_address + "svc/wsite/" + enterprise_id + "/binding?open_id=" + fan_open_id;

                        var item = {
                            title: "请先绑定会员",
                            desc: "绑定后即可访问会员专区，查看会员卡余额，预约",
                            picUrl: server_address + "resource/news2.png",
                            url: url
                        };

                        var contents = [item];

                        wx.replyNewsMessage(req, res, contents);
                        return;
                    }

                    var cardService = server_address + "svc/wsite/" + enterprise_id + "/membercards";

                    var options = {
                        method: "POST",
                        uri: cardService,
                        body: {member_id: member_id},
                        json: true
                    };

                    request(options, function(err, response, body) {

                        if(err){
                            console.log(err);
                            wx.replyTextMessage(req, res, error_message);
                            return;
                        }

                        var code = body.code;
                        if(code !== 0){
                            wx.replyTextMessage(req, res, error_message);
                            return;
                        }

                        var cards = body.result.cards;
                        if(cards.length === 0){
                            wx.replyTextMessage(req, res, "您还没有会员卡，快到店里办理吧");
                            return;
                        }

                        var url = server_address + "svc/wsite/" + enterprise_id + "/member?m_id=" + member_id;

                        var messages = [];

                        var header = {
                            title: "我的余额，点击查看更多",
                            picUrl: server_address + "resource/news2.png",
                            url: url
                        };
                        messages.push(header);

                        _.each(cards, function(item){

                            var message = {
                                picUrl: server_address + "resource/card_detail.png",
                                url: url
                            };

                            if(item.type === "recharge"){
                                message.title = item.name + "余额" + item.currentMoney.toFixed(1) + "元";
                            }else if(item.type === "recordTimeCard"){
                                message.title = item.name + "剩余" + item.remainingTimes + "次";
                            }else{
                                message.title = item.name + "截止到" + new Date(item.expired_time).Format("yy-MM-dd");
                            }

                            messages.push(message);
                        });

                        wx.replyNewsMessage(req, res, messages);
                    });
                });

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

            var url = server_address + "svc/wsite/" + enterprise_id + "/shop";

            callback(null, url, enterprise_id);
        });
    }

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

    function hasMemberBinding(url, enterprise_id, callback){

        var fan_open_id = req.weixin.fan_open_id;

        dbHelper.queryData("weixin_member_binding", {enterprise_id: enterprise_id, wx_open_id: fan_open_id}, function(err, result){

            if(err){
                callback(err);
                return;
            }

            if(result.length === 0){
                callback(null, false, enterprise_id, null);
            }else{

                var member_id = result[0].member_id;
                callback(null, true, enterprise_id, member_id);
            }
        });
    }
}