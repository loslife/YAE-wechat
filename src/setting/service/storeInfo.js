var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var chainDbHelper = require(FRAMEWORKPATH + "/utils/ChainDbHelper");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var uuid = require("node-uuid");
var fs = require("fs");
var gm = require("gm");

exports.storeInfo = storeInfo;
exports.updateWechatSetting = updateWechatSetting;
exports.uploadWechatHomeImg = uploadWechatHomeImg;

exports.queryStoreInfo = queryStoreInfo;

//提供页面
function storeInfo(req, res, next) {
    var enterpriseId = req.session.enterpriseId;
    var single_chain = req.session.single_chain;

    var data = {
        layout: "storeadmin_layout",
        menu: "storeInfo",
        storeName: req.session.storeName
    };

    querySettingAndStore(enterpriseId, single_chain, function (error, setting, store) {
        if (error) {
            logger.error({error: error, detail: enterpriseId + "查询微信设置和店铺资料失败"});
            next(error);
            return;
        }

        res.render("storeInfo", _.extend(data ,{wechatSetting: setting, store: store, enterpriseId: enterpriseId, store_type: single_chain}));
    });
}

//提供数据
function queryStoreInfo(req, res, next) {
    var enterpriseId = req.params.enterpriseId;
    var single_chain = req.query["store_type"];

    querySettingAndStore(enterpriseId, single_chain, function (error, setting, store) {
        if (error) {
            logger.error({error: error, detail: enterpriseId + "查询微信设置和店铺资料失败"});
            next(error);
            return;
        }

        doResponse(req, res, {code: 0, result: {setting: setting, store: store}});
    });
}

function updateWechatSetting(req, res, next) {
    var store = req.body.store || {};

    dbHelper.updateByID("weixin_setting", store, function (error, result) {
        if (error) {
            logger.error(error);
            next(error);
            return;
        }
        doResponse(req, res, {code: 0});
    });
}

function uploadWechatHomeImg(req, res, next) {
    var enterpriseId = req.session.enterpriseId;
    var image = req.body.image;

    var tempPath = global.appdir + "data/uploads/" + uuid.v1();

    var targetPath = global.appdir + "data/wechat/" + enterpriseId + "/";
    var targetName = "";

    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
    }

    async.series([_buildFileName, _writeImage, _cropImage, _deleteTempImg, _deleteOldImage, _updateHomePath], function (error) {
        if (error) {
            logger.error({error: error, desc: enterpriseId + "上传微店铺首页图片失败"});
            next(error);
            return;
        }
        doResponse(req, res, {code: 0, path: "/svc/public/wechat/" + enterpriseId + "/" + targetName});
    });

    function _buildFileName(callback) {
        dbHelper.getUniqueId(enterpriseId, function (error, id) {
            if (error) {
                callback(error);
                return;
            }

            targetName = id;
            targetPath += targetName;

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
            .write(targetPath,callback);
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

    function _deleteOldImage(callback) {
        var oldName = "";

        async.series([_queryOldName, _doDelete], callback);

        function _queryOldName(callback) {
            dbHelper.queryData("weixin_setting", {enterprise_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }

                if (_.isEmpty(result)) {
                    callback(enterpriseId + "查询weixin_setting失败");
                    return;
                }

                oldName = result[0].picUrl;
                callback(null);
            });
        }

        function _doDelete(callback) {
            if (!oldName) {
                callback(null);
                return;
            }

            var path = global.appdir + "data/wechat/" + enterpriseId + "/" + oldName;

            fs.exists(path, function (exists) {
                if (!exists) {
                    callback(null);
                    return;
                }
                fs.unlink(path, callback);
            });
        }
    }

    function _updateHomePath(callback) {
        dbHelper.update({enterprise_id: enterpriseId}, "weixin_setting", {picUrl: targetName}, callback)
    }
}

function querySettingAndStore(enterpriseId, single_chain, callback) {
    var wechatSetting = {};
    var store = {};

    async.parallel([_queryWechatSetting, _queryStore], function (error) {
        if (error) {
            callback(error);
            return;
        }

        callback(null, wechatSetting, store);
    });


    function _queryWechatSetting(callback) {
        async.series([_query, _init], callback);

        function _query(callback) {
            dbHelper.queryData("weixin_setting", {enterprise_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
                wechatSetting = result[0] || {};

                callback(null);
            });
        }

        function _init(callback) {
            if (!_.isEmpty(wechatSetting)) {
                if (wechatSetting.picUrl) {
                    wechatSetting.picUrl = "/svc/public/wechat/" + enterpriseId + "/" + wechatSetting.picUrl;
                } else {
                    wechatSetting.picUrl = "/svc/public/wechat/home_default.jpg";
                }
                callback(null);
                return;
            }
            wechatSetting = {};

            dbHelper.getUniqueId(enterpriseId, function (error, id) {
                if (error) {
                    callback(error);
                    return;
                }

                wechatSetting.id = id;
                wechatSetting.enterprise_id = enterpriseId;
                wechatSetting.welcomeWord = "";
                wechatSetting.picUrl = "";
                wechatSetting.state = 0;// 开通状态初始化为0，表示未开通
                dbHelper.addData("weixin_setting", wechatSetting, callback);
            });
        }
    }

    function _queryStore(callback) {
        async.parallel([_info, _operateItem], callback);

        function _info(callback) {
            if(single_chain == "chain"){        //|| single_chain == undefined
                dohelper(chainDbHelper);
            }else{
                dohelper(dbHelper);
            }

            function dohelper(helper){
                helper.queryData("tb_enterprise", {id: enterpriseId}, function (error, result) {
                    if (error) {
                        callback(error);
                        return;
                    }

                    if (!_.isEmpty(result[0])) {
                        var temp = result[0];
                        store.name = (temp.name || "");
                        store.phone = (temp.contact_phoneMobile || "");
                        store.addr = (temp.addr_state_city_area || "") + (temp.addr_detail || "");
                        store.comment = (temp.comment || "");
                        store.operateStr = store.comment;

                        if(temp.hours_begin == null || temp.hours_end == null){
                            store.workHour = "-";
                        }else{
                            store.workHour = temp.hours_begin + "-" + temp.hours_end;
                        }

                        if (temp.logo) {
                            store.logUrl = "/svc/public/mobile/backup/" + temp.logo;
                        } else {
                            store.logUrl = "/svc/public/wechat/enterprise_default.png";
                        }

                    }
                    callback(null);
                });
            }
        }

        function _operateItem(callback) {
            if(single_chain == "chain"){
                //store.operateStr = "美甲，化妆，修眉，盘发，脱发，打耳洞，嫁接眉毛，护肤品销售，化妆品销售";
                callback(null);
            }else{
                dohelper(dbHelper);
            }
            function dohelper(helper){
                helper.queryData("tb_operateItem", {enterprise_id: enterpriseId}, function (error, result) {
                    if (error) {
                        callback(error);
                        return;
                    }
                    store.operateStr = _.pluck(result, "name").join("，");
                    callback(null);
                });
            }
        }
    }
}

