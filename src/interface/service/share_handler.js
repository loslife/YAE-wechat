var wx = require("wechat-toolkit");
var async = require("async");
var _ = require("underscore");
var memberService = require("./memberService");
var tokenHelper = require("./access_token_helper");

var error_message = "乐斯美蜜似乎出了点问题，正在修复中";
var token = "yilos_wechat";

var server_address;

if(global["_g_topo"].env === "dev"){
    server_address = "http://127.0.0.1/";
}else{
    server_address = "http://wx.yilos.com/";
}

exports.handle = handleMessage;

function handleMessage(req, res, next){

    async.waterfall([_validate, _doHandle], function(err){

        if(err){
            console.log(err);
            wx.replyTextMessage(req, res, error_message);
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

                var sentence = '欢迎进入乐斯美蜜，请先输入您办理会员时留下的手机号，<a href="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxb5243e6a07f2e09a&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fwsite%2FshareBind&response_type=code&scope=snsapi_base&state=los_wsite#wechat_redirect">确认会员身份</a>后可以享受更多增值服务。';
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

                    var condition = {
                        wx_open_id: fan_open_id
                    };

                    memberService.queryCardsByCondition(condition, function(err, messages){

                        if(err){

                            if(err.message && err.message === "no_bindings"){

                                var url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxb5243e6a07f2e09a&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fwsite%2FshareBind&response_type=code&scope=snsapi_base&state=los_wsite#wechat_redirect";

                                var item = {
                                    title: "请先绑定会员",
                                    desc: "绑定后即可访问会员专区，查看会员卡余额",
                                    picUrl: server_address + "resource/news2.png",
                                    url: url
                                };

                                var contents = [item];

                                wx.replyNewsMessage(req, res, contents);

                            }else{
                                callback(err);
                            }

                            return;
                        }

                        res.send("");// response with customer service message

                        sendCustomerServiceMessage();

                        function sendCustomerServiceMessage(){

                            var global_access_token;

                            async.series([_initAccessToken, _doSend], function(err){

                                if(err){
                                    console.log(err);
                                }
                            });

                            function _initAccessToken(callback){

                                tokenHelper.getShareAccessToken(function(err, access_token){

                                    if(err){
                                        callback(err);
                                        return;
                                    }

                                    global_access_token = access_token;
                                    callback(null);
                                });
                            }

                            function _doSend(callback){

                                async.eachSeries(messages, function(message, next){

                                    wx.csReplyNews(global_access_token, fan_open_id, message, function(err, code, message){

                                        if(err){
                                            next(err);
                                            return;
                                        }

                                        switch(code){

                                            case 0:
                                                next(null);
                                                break;

                                            case 40001:

                                            case 42001:
                                                tokenHelper.refreshAccessToken("", function(err, access_token){

                                                    if(err){
                                                        next(err);
                                                        return;
                                                    }

                                                    global_access_token = access_token;
                                                    wx.csReplyNews(global_access_token, fan_open_id, message, next);
                                                });
                                                break;

                                            default:
                                                next({code: code, message: message});
                                        }
                                    });

                                }, callback);
                            }
                        }
                    });
                }
            }

            function handleView(){
                res.send("");
            }
        }
    }
}