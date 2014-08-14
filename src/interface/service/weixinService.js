var wx = require("wechat-toolkit");

var token = "";

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

        var item1 = {
            title: "乐斯真牛逼",
            desc: "确实很牛逼",
            picUrl: "http://121.40.75.73/resources/1.jpg",
            url: "http://www.yilos.com"
        };

        var item2 = {
            title: "乐斯太牛逼",
            desc: "还能更牛逼",
            picUrl: "http://121.40.75.73/resources/1.jpg",
            url: "http://www.yilos.com"
        };

        var contents = [item1, item2];

        wx.replyNewsMessage(req, res, contents);
    }

    function handleEvent(){

        if(req.weixin.event === "subscribe"){
            wx.replyTextMessage(req, res, "感谢关注乐斯");

        }else if(req.weixin.event === "CLICK"){

            if(req.weixin.event_key === "BUY"){
                wx.replyTextMessage(req, res, "后续集成支付模块");
            }else if(req.weixin.event_key == "BUSINESS"){
                wx.replyTextMessage(req, res, "后续对接渠道管理系统");
            }else{
                wx.replyTextMessage(req, res, "整齐的制服，友善的眼神");
            }

        }else{
            res.send("");
        }
    }
}