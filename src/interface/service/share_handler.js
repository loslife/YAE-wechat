var wx = require("wechat-toolkit");
var async = require("async");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");

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

                        async.each(result, function(item, next){

                        }, function(err){

                            if(err){
                                callback(err);
                                return;
                            }

                            // 输出结果
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