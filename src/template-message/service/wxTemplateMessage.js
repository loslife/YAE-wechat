var async = require("async");
var wx = require("wechat-toolkit");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var _ = require("underscore");
var tokenHelper = require("../../wx-utils/service/access_token_helper");
var templateHelper = require("./template_helper");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();

exports.sendMessage = sendMessage;

function sendMessage(req, res, next){

    var enterprise_id = req.body.enterprise_id;
    var template_id = req.body.template_id;
    var preload = req.body.entity;

    if(!templateHelper.judgeTemplateId(template_id)){
        doResponse(req, res, {code: 1, message: "模板类型不支持"});
        return;
    }

    var targets = [];

    async.waterfall([_resolveTarget, _assembleMessage, _doSend], function(err){

        if(err){
            logger.error("发送模板消息失败，原因：enterprise_id:"+enterprise_id);
            logger.error(err);
            doResponse(req, res, {code: 1, message: "发送失败"});
            return;
        }else{
            logger.error("发送模板消息成功，：qenterprise_id:"+enterprise_id);
        }

        doResponse(req, res, {message: "ok"});
    });

    function _resolveTarget(callback){

        var phoneNumber = preload["phoneNumber"];

        dbHelper.queryData("weixin_member_binding", {enterprise_id: enterprise_id, phone: phoneNumber}, function(error,results){

            // 该会员没有绑定，无法发送模板消息
            if(results.length === 0){
                callback({message: "member not binding"});
                return;
            }

            _.each(results, function(item){
                targets.push({
                    fan_open_id: item.wx_open_id,
                    app_id: item.app_id
                });
            });

            callback(null);
        });
    }

    function _assembleMessage(callback){

        async.each(targets, function(target, next){

            templateHelper.assembleEntity(target.app_id, template_id, preload, function(err, entity){

                if(err){
                    next(err);
                    return;
                }

                target.url = "";
                target.top_color = "#000000";
                target.template_id = entity.template_id;
                target.data = entity.data;
                next();
            });

        }, callback);
    }

    function _doSend(callback){

        async.eachSeries(targets, function(target, next){

            tokenHelper.getTokenByAppId(target.app_id, function(err, access_token){

                if(err){
                    next(err);
                    return;
                }

                target.access_token = access_token;
                wx.sendTemplateMessage(target, function(err, code, message){

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

                            tokenHelper.refreshAccessToken(target.app_id, function(err, new_access_token){

                                if(err){
                                    next(err);
                                    return;
                                }

                                target.access_token = new_access_token;
                                wx.sendTemplateMessage(target, next);
                            });
                            break;

                        default:
                            next({code: code, message: message});
                    }
                });
            });

        }, callback);
    }
}