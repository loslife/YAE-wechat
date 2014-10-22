var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");

exports.lightEntrance = lightEntrance;
exports.findEnterpriseByPhone = findEnterpriseByPhone;

function lightEntrance(req, res, next){

    res.render("lightEntrance", {layout: false});
}

function findEnterpriseByPhone(req, res, next){

    var phone = req.query["phone"];

    dbHelper.queryData("tb_member", {phoneMobile: phone}, function(err, records){

        if(err){
            console.log(err);
            next(err);
            return;
        }

        var result = [];

        if(records.length > 0){
            result.push({mid: records[0].id, eid: records[0].enterprise_id});
        }

        doResponse(req, res, result);
    });
}