exports.judgeTemplateId = judgeTemplateId;
exports.assembleEntity = assembleEntity;
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();

var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");

var ACCEPT = ["template_9", "template_12", "template_14", "template_8", "template_13", "template_6"];

// 9 计次卡消费
// 12 充值卡消费
// 14 充值卡充值
// 8 计次卡充值
// 13 开充值卡
// 6 开计次卡
function judgeTemplateId(template_id){
    return _.contains(ACCEPT, template_id);
}

function assembleEntity(app_id, template_id, body, callback){

    var entity;

    switch(template_id){

        case "template_9":
            entity = _assembleRecordPayment();
            break;

        case "template_12":
            entity = _assembleRechargePayment();
            break;

        case "template_14":
            entity = _assembleRechargeAdd();
            break;

        case "template_8":
            entity = _assembleRecordAdd();
            break;

        case "template_13":
            entity = _assembleRechargeNew();
            break;

        case "template_6":
            entity = _assembleRecordNew();
            break;

        default :
            callback({message: "unknown template id"});// should never happen
            return;
    }

    dbHelper.queryData("weixin_template_message", {app_id: app_id, los_template_id: template_id}, function(err, results){

        if(err){
            callback(err);
            return;
        }

        if(results.length !== 0){
            entity.template_id = results[0].wx_template_id;
        }

        callback(null, entity);
    });

    // 计次卡消费
    function _assembleRecordPayment(){

        var data = {

            first: {
                value: "您好，您已成功消费。",
                color: "#0A0A0A"
            },
            "keyword1":{
                value: body.projectList,
                color: "#CCCCCC"
            },
            "keyword2":{
                value: body.costTimes + "次",
                color: "#CCCCCC"
            },
            "keyword3":{
                value: body.enterpriseName,
                color: "#CCCCCC"
            },
            "keyword4":{
                value: body.balance + "次",
                color: "#CCCCCC"
            },
            "remark":{
                value: "祝您好心情，欢迎下次光临。",
                color: "#CCCCCC"
            }
        };

        return {
            template_id: "OOfgHUPKenzIs9AysZx54SdVf85A0MCMH7fLSO1_NL0",
            data: data
        };
    }

    // 充值卡消费
    function _assembleRechargePayment(){

        var data = {

            first: {
                value: "您好，您已成功消费。本次消费项目：" + body.projectList,
                color: "#0A0A0A"
            },
            keyword1: {
                value: body.afterDiscountMoney + "元",
                color: "#CCCCCC"
            },
            keyword2: {
                value: body.enterpriseName,
                color: "#CCCCCC"
            },
            keyword3: {
                value: body.balance,
                color: "#CCCCCC"
            },
            remark: {
                value: "祝您好心情，欢迎下次光临。",
                color: "#CCCCCC"
            }
        };

        return {
            template_id: "EqKMfYmiBqQ0qh_SxgiRJyZZNuBsS4k1I88sPNTTBG4",
            data: data
        };
    }

    // 办理充值卡
    function _assembleRechargeNew(){

        var data = {

            first: {
                value: "您好，您办理" + body.memberCardName + "成功",
                color: "#0A0A0A"
            },
            keyword1: {
                value: (body.totalMoney - body.presentMoney) + "元",
                color: "#CCCCCC"
            },
            keyword2: {
                value: body.presentMoney + "元",
                color: "#CCCCCC"
            },
            keyword3: {
                value: body.enterpriseName,
                color: "#CCCCCC"
            },
            keyword4: {
                value: body.totalMoney + "元",
                color: "#CCCCCC"
            },
            remark: {
                value: "祝您好心情，期待您的光临。",
                color: "#CCCCCC"
            }
        };

        return {
            template_id: "7oCfsFbuR9BFaVxnDBPv55hiXxFiEGeDAfkhDCHJzMA",
            data: data
        };
    }

    // 办理计次卡
    function _assembleRecordNew(){

        var data = {

            first: {
                value: "您好，您办理" + body.memberCardName + "成功",
                color: "#0A0A0A"
            },
            keyword1: {
                value: "",
                color: "#CCCCCC"
            },
            keyword2: {
                value: body.times + "次",
                color: "#CCCCCC"
            },
            keyword3: {
                value: body.enterpriseName,
                color: "#CCCCCC"
            },
            keyword4: {
                value: body.times + "次",
                color: "#CCCCCC"
            },
            remark: {
                value: "祝您好心情，期待您的光临。",
                color: "#CCCCCC"
            }
        };

        return {
            template_id: "l64yAEjL2LzCa1SU0O5VMo5oJzeSF4ae2SDrMyBSZa4",
            data: data
        };
    }

    // 储值卡充值
    function _assembleRechargeAdd(){

        var data = {

            first: {
                value: "您好，您的" + body.memberCardName + "充值成功。会员卡号：" + body.memberCardNo,
                color: "#0A0A0A"
            },
            keyword1: {
                value: body.money + "元",
                color: "#CCCCCC"
            },
            keyword2: {
                value: body.presentMoney + "元",
                color: "#CCCCCC"
            },
            keyword3: {
                value: body.enterpriseName,
                color: "#CCCCCC"
            },
            keyword4: {
                value: "",
                color: "#CCCCCC"
            },
            remark: {
                value: "祝您好心情，欢迎下次光临。",
                color: "#CCCCCC"
            }
        };

        return {
            template_id: "7oCfsFbuR9BFaVxnDBPv55hiXxFiEGeDAfkhDCHJzMA",
            data: data
        };
    }

    // 计次卡充值
    function _assembleRecordAdd(){

        var data = {

            first: {
                value: "您好，您的" + body.memberCardName + "充值成功。会员卡号：" + body.memberCardNo,
                color: "#0A0A0A"
            },
            keyword1: {
                value: "",
                color: "#CCCCCC"
            },
            keyword2: {
                value: "",
                color: "#CCCCCC"
            },
            keyword3: {
                value: body.enterpriseName,
                color: "#CCCCCC"
            },
            keyword4: {
                value: "",
                color: "#CCCCCC"
            },
            remark: {
                value: "祝您好心情，期待您的光临。",
                color: "#CCCCCC"
            }
        };

        return {
            template_id: "l64yAEjL2LzCa1SU0O5VMo5oJzeSF4ae2SDrMyBSZa4",
            data: data
        };
    }
}