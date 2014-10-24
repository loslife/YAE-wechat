var wx = require("wechat-toolkit");
var async = require("async");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var request = require("request");
var _ = require("underscore");

var server_address = "http://wx.yilos.com/";
var token = "yilos_wechat";
var error_message = "微店铺似乎出了点问题，请联系乐斯";

exports.handle = handleMessage;

function handleMessage(req, res, next){

    async.waterfall([_validate, _doHandle], function(err){

        if(err){
            console.log(err);
            wx.replyTextMessage(error_message);
        }
    });

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
        }

        function handleTextMessage(){
            res.send("您好，您的留言我们已收到，稍后与您联系");
        }

        function handleEvent(){

            switch(req.weixin.event){

                case "subscribe":
                    handleSubscribe();
                    break;

                case "CLICK":
                    handleClick();
                    break;

                case "VIEW":
                    handleView();
                    break;

                default:
                    res.send("");
            }

            function handleSubscribe(){

                var sentence = "欢迎使用乐斯微店铺，请先输入您办理会员时留下的手机号，绑定会员后即可使用各种服务";
                wx.replyTextMessage(req, res, sentence);
            }

            function handleClick(){

                var fan_open_id = req.weixin.fan_open_id;

                switch(req.weixin.event_key){

                    case "MY_CARD":
                        handleMyCard();
                        break;

                    default :
                        wx.replyTextMessage(req, res, "无法识别的点击事件");
                }

                function handleMyCard(){

                    dbHelper.queryData("weixin_member_binding", {wx_open_id: fan_open_id}, function(err, result){

                        if(err){
                            callback(err);
                            return;
                        }

                        if(result.length === 0){
                            wx.replyTextMessage(req, res, "请先绑定会员");
                            return;
                        }

                        var records = [];// 最后要返回的图文消息集

                        async.each(result, function(item, next){

                            var enterprise_id = item.enterprise_id;
                            var member_id = item.member_id;

                            var cardServiceUrl = server_address + "svc/wsite/" + enterprise_id + "/membercards";

                            var options = {
                                method: "POST",
                                uri: cardServiceUrl,
                                body: {member_id: member_id},
                                json: true
                            };

                            request(options, function(err, response, body) {

                                if(err){
                                    next(err);
                                    return;
                                }

                                var code = body.code;
                                if(code !== 0){
                                    next({message: "查询会员信息失败"});
                                    return;
                                }

                                var messages = [];// 单个店铺的图文消息

                                var cards = body.result.cards;

                                var url = server_address + "svc/wsite/" + enterprise_id + "/member?m_id=" + member_id;

                                if(cards.length === 0){

                                    var no_cards = {
                                        title: "您在店内还没有会员卡",
                                        picUrl: server_address + "resource/news2.png",
                                        url: url
                                    };
                                    messages.push(no_cards);

                                }else{

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
                                }

                                records.push(messages);// 单店图文消息放入总图文消息集
                                next(null);
                            });

                        }, function(err){

                            if(err){
                                callback(err);
                                return;
                            }

                            _.each(records, function(record){
                                wx.replyNewsMessage(req, res, record);
                            });
                        });
                    });
                }
            }

            function handleView(){
                res.send("");
            }
        }
    }
}