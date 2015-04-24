var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var wx = require("wechat-toolkit");
var async = require("async");
var request = require("request");
var _ = require("underscore");
var memberService = require("./memberService");

var server_address = "http://wx.yilos.com/";

if(global["_g_topo"].env == "dev"){
    server_address = global["_g_topo"].clientAccess.serviceurl;
}

var error_message = "微店铺似乎出了点问题，请联系乐斯";

exports.handle = handleMessage;

function handleMessage(req, res, next){

    var enterprise_id = req.query["e"];
    var token = "yilos_wechat";// default token
    var app_id = "";

    async.series([_queryToken, _validate, _doHandle], function(err){

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

            if(result[0].app_id){
                app_id = result[0].app_id;
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
        }

        function handleTextMessage(){
            wx.replyTextMessage(req, res, "您好，您的留言我们已收到，稍后与您联系");
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

                dbHelper.queryData("weixin_binding", {enterprise_id: enterprise_id}, function(err, result){

                    if(err){
                        callback(err);
                        return;
                    }

                    if(result.length === 0){
                        callback({message: "未找到绑定记录"});
                        return;
                    }

                    var name = result[0].name;
                    var app_id = result[0].app_id;
                    var enterprise_id = result[0].enterprise_id;

                    var sentence = "欢迎关注" + name +"，请先在绑定会员页面输入您在店内的手机号，<a href='https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + app_id +"&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fwsite%2F" + app_id + "%2F" + enterprise_id +"%2Fbinding&response_type=code&scope=snsapi_base&state=los_wsite#wechat_redirect'>绑定会员</a>后可以享受更多增值服务。";
                    wx.replyTextMessage(req, res, sentence);
                });
            }

            function handleClick(){

                var fan_open_id = req.weixin.fan_open_id;

                switch(req.weixin.event_key){

                    case "MEMBER_UNBIND":
                        handleMemberUnbind();
                        break;

                    case "MY_CARD":
                        handleMyCard();
                        break;

                    default :
                        wx.replyTextMessage(req, res, "无法识别的点击事件");
                }

                function handleMemberUnbind(){

                    var unbindServiceUrl = server_address + "svc/wsite/" + app_id + "/" + enterprise_id + "/unbind";

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
                            wx.replyTextMessage(req, res, "您尚未绑定会员，无法解除");
                            return;
                        }

                        wx.replyTextMessage(req, res, "解除绑定成功");
                    });
                }

                function handleMyCard(){

                    var condition = {
                        wx_open_id: fan_open_id,
                        enterprise_id: enterprise_id
                    };

                    memberService.queryCardsByCondition(app_id, condition, function(err, messages){

                        if(err){

                            if(err.message && err.message === "no_bindings"){

                                var url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + app_id + "&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fwsite%2F" + app_id + "%2F" + enterprise_id + "%2Fbinding&response_type=code&scope=snsapi_base&state=los_wsite#wechat_redirect";

                                var item = {
                                    title: "请先绑定会员",
                                    desc: "绑定后即可访问会员专区，查看会员卡余额，预约",
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