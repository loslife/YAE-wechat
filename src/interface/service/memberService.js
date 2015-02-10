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

var baseurl = global["_g_clusterConfig"].baseurl;

exports.queryCardsByCondition = queryCardsByCondition;

// callback(err, messages)
function queryCardsByCondition(app_id, condition, callback){

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

            var queryEnterpriseNameUrl = baseurl + "/enterprise/name/" + enterprise_id;

            var options = {
                method: "GET",
                uri: queryEnterpriseNameUrl,
                json: true
            };

            request(options, function(err, response, body) {

                if(err){
                    next(err);
                    return;
                }

                var code = body.code;
                if(code !== 0){
                    next({errorCode: 500, errorMessage: "查询企业名称失败"});
                    return;
                }

                var name = body.result.name;
                var store_type = body.result.store_type;
                if(_.isEmpty(name)){
                    name = "未命名店铺";
                }

                var cardServiceUrl = server_address + "svc/wsite/" + enterprise_id + "/membercards?store_type=" + store_type;

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

                    var url = server_address + "svc/wsite/" + app_id + "/" + enterprise_id + "/member?m_id=" + member_id + "&store_type=" + store_type;

                    if(cards.length === 0){

                        var no_cards = {
                            title: name + "：您在店内还没有办理会员卡",
                            picUrl: server_address + "resource/news2.png",
                            url: url
                        };
                        messages.push(no_cards);

                    }else{

                        var header = {
                            title: name + "：您在店内的会员卡信息",
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