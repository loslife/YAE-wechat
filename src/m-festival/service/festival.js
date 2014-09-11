var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var uuid = require('node-uuid');

exports.list = list;
exports.getPresent = getPresent;
exports.share = share;
exports.walkinCome = walkinGetPresent;
exports.shareBonus = shareBonus;

function list(req, res, next){

    var enterpriseId = req.params["enterpriseId"];

    dbHelper.queryData("weixin_festivals", {enterprise_id: enterpriseId, state: 1}, function(err, result){

        if(err){
            console.log(err);
            next(err);
            return;
        }

        res.render("festivals", {enterprise_id: enterpriseId, menu: "festival", festivals: result});
    });
}

function getPresent(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var memberId = req.session.member_id;

    if(!memberId){

        queryFestivalById(enterpriseId, festivalId, function(err, festival){

            if(err){
                next(err);
                return;
            }

            res.render("input", {enterprise_id: enterpriseId, menu: "festival", festival: festival});
        });

        return;
    }

    // 会员已经登陆的情况
    hasProvidePresent("normal", enterpriseId, festivalId, memberId, null, function(err, received){

        if(err){
            next(err);
            return;
        }

        if(received){
            res.redirect("/svc/wsite/" + enterpriseId + "/share?fid=" + festivalId + "&share_id=" + memberId);
            return;
        }

        providePresent("normal", enterpriseId, festivalId, memberId, null, function(err){

            if(err){
                next(err);
                return;
            }
            res.redirect("/svc/wsite/" + enterpriseId + "/share?fid=" + festivalId + "&share_id=" + memberId);
        });
    });
}

function share(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var shareMemberId = req.query["share_id"];
    var sharePhone = req.query["share_phone"];

    var model = {
        enterprise_id: enterpriseId,
        menu: "festival",
        festival_id: festivalId,
        share_id: shareMemberId,
        share_phone: sharePhone
    };

    res.render("gotAndShare", model);
}

function walkinGetPresent(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var phone = req.body.phone;

    hasProvidePresent("normal", enterpriseId, festivalId, null, phone, function(err, received){

        if(err){
            next(err);
            return;
        }

        if(received){
            doResponse(req, res, {message: "repeat"});
            return;
        }

        providePresent("normal", enterpriseId, festivalId, null, phone, function(err){

            if(err){
                next(err);
                return;
            }

            doResponse(req, res, {message: "ok"});
        });
    });
}

function shareBonus(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var shareMemberId = req.body.share_id;
    var sharePhone = req.body.share_phone;

    hasProvidePresent("bonus", enterpriseId, festivalId, shareMemberId, sharePhone, function(err, received){

        if(err){
            next(err);
            return;
        }

        if(received){
            doResponse(req, res, {message: "repeat"});
            return;
        }

        providePresent("bonus", enterpriseId, festivalId, shareMemberId, sharePhone, function(err){

            if(err){
                next(err);
                return;
            }

            doResponse(req, res, {message: "ok"});
        });
    });
}

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

function hasProvidePresent(type, enterpriseId, festivalId, memberId, phone, callback){

    var condition = {
        type: type,
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

function providePresent(type, enterpriseId, festivalId, memberId, phone, callback){

    queryFestivalById(enterpriseId, festivalId, function(err, festival){

        if(err){
            callback(err);
            return;
        }

        var data = {
            id: uuid.v1(),
            enterprise_id: enterpriseId,
            festival_id: festivalId,
            receive_date: new Date().getTime(),
            client_has_sync: 0,
            type: type
        };

        if(type === "normal"){
            data.present_type = festival.present_type;
            data.present_id = festival.present_id;
            data.present_name = festival.present_name;
        }else if(type === "bonus"){
            data.present_type = festival.share_present_type;
            data.present_id = festival.share_present_id;
            data.present_name = festival.share_present_name;
        }

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

            callback(null);
        });
    });
}