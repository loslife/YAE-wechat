var wx = require("wechat-toolkit");
var async = require("async");
var _ = require("underscore");
var memberService = require("./memberService");

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

                var sentence = '欢迎使用乐斯微店铺，请先输入您办理会员时留下的手机号，<a href="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxb5243e6a07f2e09a&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fwsite%2FshareBind&response_type=code&scope=snsapi_base&state=los_wsite#wechat_redirect">绑定会员</a>后即可使用各种服务';
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
                                wx.replyTextMessage(req, res, "请先绑定会员");
                            }else{
                                callback(err);
                            }

                            return;
                        }

                        _.each(messages, function(message){
                            wx.replyNewsMessage(req, res, message);
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