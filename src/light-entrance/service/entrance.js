var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var chainDbHelper = require(FRAMEWORKPATH + "/utils/ChainDbHelper")

exports.lightEntrance = lightEntrance;
exports.findEnterpriseByPhone = findEnterpriseByPhone;

function lightEntrance(req, res, next){

    res.render("inputPhone", {layout: false, type: "entrance", open_id: "", enterprise_id: "", app_id: "wxb5243e6a07f2e09a"});
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
            result.push({mid: records[0].id, eid: records[0].enterprise_id, store_type: "single"});
        }else{
            chainDbHelper.queryData("tb_member", {phoneMobile: phone}, function(err, records){
                if(err){
                    console.log(err);
                    next(err);
                    return;
                }
                if(records.length > 0){
                    result.push({mid: records[0].id, eid: records[0].master_id, store_type: "chain"});
                }
            });
        }

        doResponse(req, res, result);
    });
}