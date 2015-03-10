var wx = require("wechat-toolkit");
var exclusive = require("./exclusive_handler");
var share = require("./share_handler");
var reply = require("../../meiguanjia/reply_message");

var token = "yilos_wechat";

exports.enable_dev_mode = wx.enable_dev_mode(token);
exports.enable_dev_mode_mei = wx.enable_dev_mode(token);
exports.handleWXRequest = handleWXRequest;
exports.handleWXMGJRequest = handleWXMGJRequest;

function handleWXRequest(req, res, next){

    var enterprise_id = req.query["e"];

    if(!enterprise_id){
        share.handle(req, res, next);// 乐斯公众号
    }else{
        exclusive.handle(req, res, next);// 专属公众号
    }
}

function handleWXMGJRequest(req, res, next){
    reply.handle(req, res, next);
}