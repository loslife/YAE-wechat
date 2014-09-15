var datas = new (require(FRAMEWORKPATH + "/bus/request"))();
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var uuid = require('node-uuid');
var async = require("async");

exports.queryFestivalById = queryFestivalById;
exports.hasProvidePresent = hasProvidePresent;
exports.providePresent = providePresent;
exports.countSentPresent = countSentPresent;
exports.reachLimit = reachLimit;

function queryFestivalById(enterpriseId, festivalId, callback){

    dbHelper.queryData("weixin_festivals", {enterprise_id: enterpriseId, id: festivalId}, function(err, result){

        if(err){
            console.log(err);
            callback(err);
            return;
        }

        if(result.length === 0){
            callback({errorMessage:"活动不存在"});
            return;
        }

        callback(null, result[0]);
    });
}

function hasProvidePresent(enterpriseId, festivalId, memberId, phone, callback){

    var condition = {
        enterprise_id: enterpriseId,
        festival_id: festivalId
    };

    if(memberId){
        condition.member_id = memberId;
    }

    if(phone){
        condition.phone = phone;
    }

    dbHelper.queryData("weixin_present_received", condition, function(err, result){

        if(err){
            console.log(err);
            callback(err);
            return;
        }

        callback(null, result.length !== 0);
    });
}

function providePresent(enterpriseId, festivalId, memberId, phone, callback){

    queryFestivalById(enterpriseId, festivalId, function(err, festival){

        if(err){
            callback(err);
            return;
        }

        var data = {
            id: uuid.v1(),
            enterprise_id: enterpriseId,
            festival_id: festivalId,
            create_date: new Date().getTime(),
            state: 0,
            present_type: festival.present_type,
            present_id: festival.present_id,
            present_name: festival.present_name
        };

        if(memberId){
            data.member_id = memberId;
        }

        if(phone){
            data.phone = phone;
        }

        // 发放礼物
        dbHelper.addData("weixin_present_received", data, function(err, result){

            if(err){
                console.log(err);
                callback(err);
                return;
            }

            // 增加发放礼物次数
            dbHelper.updateInc({enterprise_id: enterpriseId, id: festivalId}, "weixin_festivals", {send_count: 1}, function(err, result){
                if(err){
                    console.log(err);
                }
            });

            if(memberId){
                callback(null);
            }else{
                _generateSecurityCode(result, callback);
            }
        });
    });

    function _generateSecurityCode(model, callback){

        var code = Math.round(900000 * Math.random() + 100000) + "";

        async.series([_saveCode, _sendSMS], callback);

        function _saveCode(callback){

            model.security_code = code;

            dbHelper.updateByID("weixin_present_received", model, function(err, result){
                callback(err);
            });
        }

        function _sendSMS(callback){

            var message = "您已领取优惠券，激活码：" + code + "。到店凭激活码消费。";

            var smsContent = {
                message: message,
                mobileNumbers: phone,
                scheduleTime: '',
                extendAccessNum: '',
                f: '1'
            };

            datas.postResource("/svc/sms/sendSMS", "", smsContent).then(function(result){

                var flag = result.result;

                if(0 === flag){
                    callback(null);
                    return;
                }
                callback({errorCode: "88888601"});

            }, function(){
                callback({errorCode: "88888601"});
            });
        }
    }
}

function countSentPresent(enterpriseId, festivalId, callback){

    dbHelper.count("weixin_present_received", {enterprise_id: enterpriseId, festival_id: festivalId}, function(err, count){

        if(err){
            console.log(err);
            callback(err);
            return;
        }

        callback(null, count);
    });
}

function reachLimit(enterpriseId, festivalId, callback){

    queryFestivalById(enterpriseId, festivalId, function(err, festival){

        if(err){
            callback(err);
            return;
        }

        countSentPresent(enterpriseId, festivalId, function(err, count){

            if(err){
                callback(err);
                return;
            }

            callback(null, count >= festival.limit_number);
        });
    });
}