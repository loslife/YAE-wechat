var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var wx = require("wechat-toolkit");
var async = require("async");
var request = require("request");
var _ = require("underscore");

var server_address = "http://wx.yilos.com/";

if(global["_g_topo"].env == "dev"){
    server_address = global["_g_topo"].clientAccess.serviceurl;
}

var default_welcome = "感谢您的关注，我们会为您提供最好的服务";
var error_message = "微店铺似乎出了点问题，请联系乐斯";

exports.handle = handleMessage;

function handleMessage(req, res, next){

    var enterprise_id = req.query["e"];
    var token = "yilos_wechat";// default token

    async.waterfall([_queryToken, _validate, _doHandle], function(err){

        if(err){
            console.log(err);
            wx.replyTextMessage(req, res, error_message);
        }
    });

    function _queryToken(callback){

        dbHelper.queryData("weixin_binding", {enterprise_id: enterprise_id}, function(err, result){

            if(err){
                callback(err);
                return;
            }

            if(result.length === 0){
                callback({message: "未找到关联微店铺"});
                return;
            }

            if(result[0].token){
                token = result[0].token;
            }
            callback(null);
        });
    }

    function _validate(callback){

        var flag = wx.validate(req, token);
        if(!flag){
            callback({message: "不是微信发来的消息"});
        }else{
            callback(null);
        }
    }

    function _doHandle(callback){

        switch(req.weixin.message_type){

            case "text":
                handleTextMessage();
                break;

            case "event":
                handleEvent();
                break;

            default :
                res.send("");
                callback(null);
        }

        function handleTextMessage(){

            var url = server_address + "svc/wsite/" + enterprise_id + "/shop";

            var item = {
                title: "请访问我们的微网站",
                desc: "查看店铺资料，产品和优惠信息",
                picUrl: server_address + "resource/logo.jpg",
                url: url
            };

            var contents = [item];
            wx.replyNewsMessage(req, res, contents);
            callback(null);
        }

        function handleEvent(){

            switch(req.weixin.event){

                case "subscribe":
                    handleSubscribe();
                    break;

                case "CLICK":
                    handleClick();
                    break;

                default:
                    res.send("");
                    callback(null);
            }

            function handleSubscribe(){

                dbHelper.queryData("weixin_setting", {enterprise_id: enterprise_id}, function(err, result){

                    if(err){
                        callback(err);
                        return;
                    }

                    var welcome_words = default_welcome;

                    if(result.length !== 0){
                        welcome_words = result[0].welcomeWord;
                    }

                    wx.replyTextMessage(req, res, welcome_words);
                    callback(null);
                });
            }

            function handleClick(){

                var fan_open_id = req.weixin.fan_open_id;

                switch(req.weixin.event_key){

                    case "WSITE":
                        handleWSITE();
                        break;

                    case "MEMBER_BINDING":
                        handleMemberBinding();
                        break;

                    case "MEMBER_UNBIND":
                        handleMemberUnbind();
                        break;

                    case "MY_CARD":
                        handleMyCard();
                        break;

                    default :
                        wx.replyTextMessage(req, res, "无法识别的点击事件");
                        callback(null);
                }

                function handleWSITE(){

                    var url = server_address + "svc/wsite/" + enterprise_id + "/shop";

                    hasMemberBinding(fan_open_id, function(err, flag, member_id){

                        if(err){
                            callback(err);
                            return;
                        }

                        if(flag){
                            url = url + "?m_id=" + member_id;
                        }

                        var item = {
                            title: "请访问我们的微网站",
                            desc: "查看店铺资料，产品和优惠信息",
                            picUrl: server_address + "resource/logo.jpg",
                            url: url
                        };

                        var contents = [item];
                        wx.replyNewsMessage(req, res, contents);
                        callback(null);
                    });
                }

                function handleMemberBinding(){

                    hasMemberBinding(fan_open_id, function(err, flag, member_id){

                        if(err){
                            callback(err);
                            return;
                        }

                        if(flag){
                            wx.replyTextMessage(req, res, "您已经绑定会员，无需重复绑定");
                            callback(null);
                            return;
                        }

                        var url = server_address + "svc/wsite/" + enterprise_id + "/binding?open_id=" + fan_open_id;

                        var item = {
                            title: "点击绑定",
                            desc: "绑定后即可访问会员专区，查看会员卡余额，预约",
                            picUrl: server_address + "resource/news2.png",
                            url: url
                        };

                        var contents = [item];
                        wx.replyNewsMessage(req, res, contents);
                        callback(null);
                    });
                }

                function handleMemberUnbind(){

                    var unbindServiceUrl = server_address + "svc/wsite/" + enterprise_id + "/unbind";

                    var options = {
                        method: "POST",
                        uri: unbindServiceUrl,
                        body: {open_id: fan_open_id},
                        json: true
                    };

                    request(options, function(err, response, body) {

                        if(err){
                            callback(err);
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
                            callback(null);
                            return;
                        }

                        wx.replyTextMessage(req, res, "解除绑定成功");
                        callback(null);
                    });
                }

                function handleMyCard(){

                    hasMemberBinding(fan_open_id, function(err, flag, member_id){

                        if(err){
                            callback(err);
                            return;
                        }

                        if(!flag){

                            var url = server_address + "svc/wsite/" + enterprise_id + "/binding?open_id=" + fan_open_id;

                            var item = {
                                title: "请先绑定会员",
                                desc: "绑定后即可访问会员专区，查看会员卡余额，预约",
                                picUrl: server_address + "resource/news2.png",
                                url: url
                            };

                            var contents = [item];

                            wx.replyNewsMessage(req, res, contents);
                            callback(null);
                            return;
                        }

                        var cardServiceUrl = server_address + "svc/wsite/" + enterprise_id + "/membercards";

                        var options = {
                            method: "POST",
                            uri: cardServiceUrl,
                            body: {member_id: member_id},
                            json: true
                        };

                        request(options, function(err, response, body) {

                            if(err){
                                callback(err);
                                return;
                            }

                            var code = body.code;
                            if(code !== 0){
                                callback({message: "查询会员信息失败"});
                                return;
                            }

                            var cards = body.result.cards;
                            if(cards.length === 0){
                                wx.replyTextMessage(req, res, "您还没有会员卡，快到店里办理吧");
                                callback(null);
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
                            callback(null);
                        });
                    });
                }

                function hasMemberBinding(fan_open_id, callback){

                    dbHelper.queryData("weixin_member_binding", {enterprise_id: enterprise_id, wx_open_id: fan_open_id}, function(err, result){

                        if(err){
                            callback(err);
                            return;
                        }

                        if(result.length === 0){
                            callback(null, false);
                        }else{
                            var member_id = result[0].member_id;
                            callback(null, true, member_id);
                        }
                    });
                }
            }
        }
    }
}