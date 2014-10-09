var wx = require("wechat-toolkit");

var token = "yilos_wechat";

exports.handle = handleMessage;

function handleMessage(req, res, next){

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
        res.send("收到文字消息");
    }

    function handleEvent(){
        res.send("收到事件推送");
    }
}