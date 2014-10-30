var async = require("async");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var request = require("request");
var _ = require("underscore");

var server_address;

if(global["_g_topo"].env === "dev"){
    server_address = "http://127.0.0.1/";
}else{
    server_address = "http://wx.yilos.com/";
}

exports.hasMemberBinding = hasMemberBinding;
exports.queryCardsByCondition = queryCardsByCondition;

// callback(err, flag, member_id)
function hasMemberBinding(fan_open_id, enterprise_id, callback){

    dbHelper.queryData("weixin_member_binding", {enterprise_id: enterprise_id, wx_open_id: fan_open_id}, function(err, result){

        if(err){
            callback(err);
            return;
        }

        if(result.length === 0){
            callback(null, false);
        }else{
            var member_id = result[0].member_id;
            callback(null, true, member_id);
        }
    });
}

// callback(err, messages)
function queryCardsByCondition(condition, callback){

    dbHelper.queryData("weixin_member_binding", condition, function(err, result){

        if(err){
            callback(err);
            return;
        }

        if(result.length === 0){
            callback({message: "no_bindings"});
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
            }else{
                callback(null, records);
            }
        });
    });
}