var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var chainDbHelper = require(FRAMEWORKPATH + "/utils/ChainDbHelper");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var uuid = require("node-uuid");
var fs = require("fs");
var path = require("path");
var _ = require("underscore");
var gm = require("gm");
var utils = require(FRAMEWORKPATH + "/utils/utils");

exports.init = init;
exports.queryFestivals = queryFestivals;
exports.newFestivals = newFestivals;
exports.editFestivals = editFestivals;
exports.removeFestivals = removeFestivals;
exports.updateState = updateState;
exports.updatePromoteState = updatePromoteState;

var single_chain = null;
function init(req, res, next) {
    var enterpriseId = req.session.enterpriseId;
    single_chain = req.session.single_chain;

    dbHelper.queryData("weixin_festivals", {enterprise_id: enterpriseId}, function (error, result) {
        if (error) {
            logger.error(enterpriseId + ",查询优惠活动列表失败，error：" + error);
        }

        var data = {
            layout: "storeadmin_layout",
            menu: "festivals",
            storeName: req.session.storeName,
            enterpriseId: enterpriseId,
            festivals: result || []
        };

        _.each(data.festivals, function (item) {
            if (item.title && !_.isEmpty(item.title)) {
                item.title = _specialCharacter(item.title);
            }
            if (item.description && !_.isEmpty(item.description)) {
                item.description = _specialCharacter(item.description);
            }
            if (item.begin_date && !_.isEmpty(item.begin_date + "")) {
                item.begin_date = utils.getDateString(item.begin_date);
            }
            if (item.end_date && !_.isEmpty(item.end_date + "")) {
                item.end_date = utils.getDateString(item.end_date);
            }
        });
        queryPresentItemsAndCoupons(enterpriseId, function (error, result) {
            if (error) {
                logger.error(enterpriseId + "，查询赠送服务、现金券列表失败，error：" + error);
            }
            res.render("festivals_edit", _.extend(data, result));
        });
    });
}

function queryFestivals(req, res, next) {
    var enterpriseId = req.params["enterpriseId"];
    dbHelper.queryData("weixin_festivals", {enterprise_id: enterpriseId}, function (error, result) {
        if (error) {
            logger.error(enterpriseId + ",查询优惠活动列表失败，error：" + error);
            doResponse(req, res, error);
        } else {
            _.each(result, function (item) {
                if (item.pic_url) {
                    item.pic_url = "/svc/public/wechat/" + enterpriseId + "/" + item.pic_url;
                } else {//使用默认图片
                    item.pic_url = "/svc/public/wechat/festivals_default.png";
                }
            });

            doResponse(req, res, {code: 0, result: result});
        }
    });
}

function newFestivals(req, res, next) {
    var enterpriseId = req.session.enterpriseId;
    var image = req.body.image;
    var data = {
        id: uuid.v1(),
        enterprise_id: enterpriseId,
        title: req.body.title,
        description: req.body.description,
        begin_date: getDateMillisecond(req.body.beginDate),
        end_date: getDateMillisecond(req.body.endDate),
        limit_number: req.body.limitNumber,
        pic_url: "",
        present_type: req.body.presentType,
        present_id: req.body.presentId,
        present_name: req.body.presentName,
        create_date: new Date().getTime(),
        state: _calcState(req.body.state, req.body.promote), // 0未激活，1已激活
        promote: Number(req.body.promote) || 0, // 0不推荐，1推荐（上首页）
        view_count: 0,//查看次数
        send_count_member: 0,//领取次数
        send_count_walkin: 0,//领取次数
        share_count: 0,//分享次数
        turnover_grow: 0//该活动带来的营业额增长
    }

    var fileName = "";
    async.series([_checkHasFestivalsThisMonth, _uploadFile, _saveData], function (error) {
        if (error) {
            logger.error(enterpriseId + "，创建优惠活动失败。");
        }
        doResponse(req, res, error);
    });

    function _checkHasFestivalsThisMonth(callback) {
        dbHelper.queryData("weixin_festivals", {enterprise_id: enterpriseId}, function (error, result) {
            if (error) {
                logger.error(enterpriseId + "，创建优惠活动时，查询优惠活动失败，error：" + error);
                callback(error);
                return;
            }
            var nowDate = new Date(data.create_date);
            var festivals = _.find(result, function (item) {
                var createDate = new Date(item.create_date);
                return nowDate.getFullYear() == createDate.getFullYear() && nowDate.getMonth() == createDate.getMonth()
            });
            if (festivals) {
                callback({code: 1, errorMsg: "新建优惠活动失败，每个月只能新建一条优惠活动"});
                return;
            }
            callback(null);
        });
    }

    function _uploadFile(callback) {
        if (!image) {
            callback(null);
            return;
        }
        uploadFestivalsImg(enterpriseId, image, function (error, name) {
            if (error) {
                logger.error(enterpriseId + "，创建优惠活动时，上传文件失败，error：" + error);
            }
            fileName = name;
            callback(error);
        })
    }

    function _saveData(callback) {
        data.pic_url = fileName;
        dbHelper.addData("weixin_festivals", data, callback);
    }
}

function editFestivals(req, res, next) {
    var enterpriseId = req.session.enterpriseId;
    var id = req.body.id;
    var image = req.body.image;
    var data = {
        title: req.body.title,
        description: req.body.description,
        begin_date: getDateMillisecond(req.body.beginDate),
        end_date: getDateMillisecond(req.body.endDate),
        limit_number: req.body.limitNumber,
        present_type: req.body.presentType,
        present_id: req.body.presentId,
        present_name: req.body.presentName,
        state: _calcState(req.body.state, req.body.promote), // 0未激活，1已激活
        promote: Number(req.body.promote) || 0, // 0不推荐，1推荐（上首页）
        modify_date: new Date().getTime()
    }

    async.series([_uploadFile, _removeOldFile, _updateData], function (error) {
        if (error) {
            logger.error(enterpriseId + "，编辑优惠活动失败，error：" + error);
        }
        doResponse(req, res, error);
    });

    function _uploadFile(callback) {
        if (!image) {
            callback(null);
            return;
        }
        uploadFestivalsImg(enterpriseId, image, function (error, fileName) {
            if (error) {
                logger.error(enterpriseId + "，编辑优惠活动时，上传图片失败，error：" + error);
                callback(error);
                return;
            }
            if (fileName && !_.isEmpty(fileName)) {
                data.pic_url = fileName;
            }
            callback(null);
        });
    }

    function _removeOldFile(callback) {
        if (!image) {
            callback(null);
            return;
        }
        var oldFileName = "";
        async.series([_queryOldName, _doDelete], callback);
        function _queryOldName(callback) {
            dbHelper.queryData("weixin_festivals", {id: id, enterprise_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
                if (_.isEmpty(result)) {
                    callback(enterpriseId + "查询weixin_festivals失败");
                    return;
                }
                oldFileName = result[0].pic_url;
                callback(null);
            });
        }

        function _doDelete(callback) {
            if (!oldFileName || _.isEmpty(oldFileName)) {
                callback(null);
                return;
            }
            var oldPath = path.resolve(global.appdir + "data/wechat/" + enterpriseId + "/" + oldFileName);
            fs.exists(oldPath, function (exists) {
                if (!exists) {
                    callback(null);
                    return;
                }
                fs.unlink(oldPath, callback);
            });
        }
    }

    function _updateData(callback) {
        dbHelper.update({id: id, enterprise_id: enterpriseId}, "weixin_festivals", data, function (error, result) {
            if (error) {
                logger.error(enterpriseId + "，编辑优惠活动信息失败，error：" + error);
            }
            callback(error);
        });
    }
}

function removeFestivals(req, res, next) {
    dbHelper.deleteDataByCondition("weixin_festivals", {id: req.body.id, enterprise_id: req.session.enterpriseId}, function (error) {
        doResponse(req, res, error);
    });
}

function updateState(req, res, next) {
    var state = _calcState(req.body.state, req.body.promote);
    dbHelper.update({id: req.body.id, enterprise_id: req.session.enterpriseId}, "weixin_festivals", {state: state}, function (error) {
        doResponse(req, res, error);
    });
}

function updatePromoteState(req, res, next) {
    dbHelper.update({id: req.body.id, enterprise_id: req.session.enterpriseId}, "weixin_festivals", {state: _calcState(req.body.state, req.body.promote), promote: Number(req.body.promote) || 0}, function (error) {
        doResponse(req, res, error);
    });
}

function queryPresentItemsAndCoupons(enterpriseId, callback) {
    var items = [];
    async.parallel([_queryPresentItems, _queryCoupons], function (error) {
        callback(error, {items: items});
    });

    function _queryPresentItems(callback) {
        var serviceAttrMap = [];
        var services = [];

        async.series([_queryPresentService, _queryServices, _buildPresentItems], function (error) {
            callback(error);
        });

        function _queryPresentService(callback) {
            if(single_chain == "chain"){
                chainDbHelper.queryData("tb_serviceattrmap", {groupName: "present", master_id: enterpriseId}, function (error, result) {
                    serviceAttrMap = result;
                    callback(error);
                });
            }else{
                dbHelper.queryData("tb_serviceattrmap", {groupName: "present", enterprise_id: enterpriseId}, function (error, result) {
                    serviceAttrMap = result;
                    callback(error);
                });
            }
        }

        function _queryServices(callback) {
            if(single_chain == "chain"){
                chainDbHelper.queryData("tb_service", {master_id: enterpriseId}, function (error, result) {
                    services = result;
                    callback(error);
                });
            }else{
                dbHelper.queryData("tb_service", {enterprise_id: enterpriseId}, function (error, result) {
                    services = result;
                    callback(error);
                });
            }

        }

        function _buildPresentItems(callback) {
            if (!serviceAttrMap || _.isEmpty(serviceAttrMap) || !services || _.isEmpty(services)) {
                callback(null);
                return;
            }
            _.each(serviceAttrMap, function (attr) {
                var service = _.find(services, function (service) {
                    return service.id == attr.service_id;
                });
                if (service) {
                    items.push({
                        id: service.id, name: service.name, type: "present", typeName: " 赠送服务"
                    });
                }
            });
            callback(null);
        }
    }

    function _queryCoupons(callback) {
        var sql = "select * from planx_graph.tb_memberCardCategory where baseInfo_type = :baseInfo_type and enterprise_id = :enterprise_id";
        if(single_chain == "chain"){
            chainDbHelper.execSql(sql, {baseInfo_type: "coupon", master_id: enterpriseId}, function (error, result) {
                if (result && !_.isEmpty(result)) {
                    _.each(result, function (item) {
                        items.push({id: item.id, name: item.name, type: "coupon", typeName: " 现金劵"});
                    });
                }
                callback(error);
            });
        }else{
            dbHelper.execSql(sql, {baseInfo_type: "coupon", enterprise_id: enterpriseId}, function (error, result) {
                if (result && !_.isEmpty(result)) {
                    _.each(result, function (item) {
                        items.push({id: item.id, name: item.name, type: "coupon", typeName: " 现金劵"});
                    });
                }
                callback(error);
            });
        }
    }
}

function uploadFestivalsImg(enterpriseId, image, callback) {
    var tempPath = path.resolve(global.appdir + "data/uploads/" + uuid.v1());
    var targetPath = global.appdir + "data/wechat/" + enterpriseId + "/";
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
    }
    var targetName = "";
    async.series([_buildFileName, _writeImage, _cropImage, _deleteTempImg], function (error) {
        if (error) {
            logger.error(enterpriseId + "，上传微店铺首页图片失败，tempPath：" + tempPath + "，targetPath：" + targetPath + "，error：" + error);
            callback(error);
            return;
        }
        callback(null, targetName);
    });

    function _buildFileName(callback) {
        dbHelper.getUniqueId(enterpriseId, function (error, id) {
            if (error) {
                callback(error);
                return;
            }
            targetName = id;
            targetPath = path.resolve(targetPath + targetName);
            callback(null);
        });
    }

    function _writeImage(callback) {
        var bitmap = new Buffer(image.data, "base64");
        fs.writeFile(tempPath, bitmap, callback);
    }

    function _cropImage(callback) {
        var position = image.position || {};

        var x = position.x;
        var y = position.y;
        var cropW = position.w;
        var cropH = position.h;

        gm(tempPath).crop(cropW, cropH, x, y)
            .write(targetPath, callback);
    }

    function _deleteTempImg(callback) {
        fs.exists(tempPath, function (exists) {
            if (!exists) {
                callback(null);
                return;
            }
            fs.unlink(tempPath, callback);
        });
    }
}

function _calcState(state, promote) {
    //如果是推荐状态，则将优惠活动状态设置为已激活
    return promote == 1 ? 1 : (Number(state) || 0);
}

function _specialCharacter(string) {
    var newString = "";
    for (var i = 0; i < string.length; i++) {
        c = string.charAt(i);
        switch (c) {
            case '\"':
                newString += "\\\"";
                break;
            case '\\':
                newString += "\\\\";
                break;
            case '/':
                newString += "\\/";
                break;
            case '\b':
                newString += "\\b";
                break;
            case '\f':
                newString += "\\f";
                break;
            case '\n':
                newString += "\\n";
                break;
            case '\r':
                newString += "\\r";
                break;
            case '\t':
                newString += "\\t";
                break;
            default:
                newString += c;
        }
    }
    return newString;
}


function getDateMillisecond(date) {
    return (date && !_.isEmpty(date)) ? new Date(date).getTime() : "";
}