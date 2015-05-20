var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var dataProxyFC  = require(FRAMEWORKPATH + "/db/dataProxyFC");
var mysqlProxy = dataProxyFC.getSqlProxy(dataProxyFC.C.DEFAULT_SQLDB);
var chainDbHelper = require(FRAMEWORKPATH + "/utils/ChainDbHelper");

exports.searchItem = searchItem;
exports.queryAllItem = queryAllItem;

exports.addShelvesItem = addShelvesItem;

exports.queryShelvesItem = queryShelvesItem;
exports.queryShelvesItem2 = queryShelvesItem2;
exports.queryShelvesByItemId = queryShelvesByItemId;

exports.searchShelvesByName = searchShelvesByName;

var http_server = global["_g_topo"].clientAccess.serviceurl + "/";//"http://121.40.75.73/svc/";

function searchItem(enterpriseId, key, singleOrChain, callback) {
    var shelvesIdList = [];
    var searchResult = [];

    async.series([_queryShelves, _searchItem], function (error) {
        callback(error, searchResult);
    });

    function _queryShelves(callback) {
        queryShelvesItem(enterpriseId, singleOrChain, function (error, result) {
            if (error) {
                callback(error);
                return;
            }
            shelvesIdList = _.pluck(result, "itemId");
            callback(null);
        });
    }

    function _searchItem(callback) {
        var sql = "select * from planx_graph.tb_service" +
            " where tb_service.enterprise_id = :enterprise_id and tb_service.name like :name;";

        mysqlProxy.execSql(sql, {enterprise_id: enterpriseId, name: "%" + key + "%"}, function (error, result) {
            if (error) {
                callback(error);
                return;
            }

            filterItemNoUseKey(result, singleOrChain, enterpriseId, function(error, result){
                searchResult = markItemAlreadyShelves(result, shelvesIdList);
                callback(null);
            })
        });
    }
}

function queryAllItem(enterpriseId, singleOrchain, callback) {
    var cateId2ItemList = {};
    var shelvesIdList = [];
    var cateList = [];
    async.series([_queryShelves, _queryItem, _queryCate], function (error) {
        callback(error, cateList, cateId2ItemList);
    });

    function _queryShelves(callback) {
        queryShelvesItem(enterpriseId, singleOrchain, function (error, result) {
            if (error) {
                callback(error);
                return;
            }
            shelvesIdList = _.pluck(result, "itemId");
            callback(null);
        });
    }

    function _queryItem(callback) {
        if(singleOrchain == "chain"){
            chainDbHelper.queryData("tb_service", {master_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }

                _.each(result, _escapeBadCharacter);// 消除'，"等特殊字符

                filterItemNoUseKey(result, singleOrchain, enterpriseId, function(error, result){
                    cateId2ItemList = _.groupBy(markItemAlreadyShelves(result, shelvesIdList), "cateId");
                    callback(null);
                });
            });
        }else{
            dbHelper.queryData("tb_service", {enterprise_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }

                _.each(result, _escapeBadCharacter);// 消除'，"等特殊字符

                filterItemNoUseKey(result, singleOrchain, enterpriseId, function(error, result){
                    cateId2ItemList = _.groupBy(markItemAlreadyShelves(result, shelvesIdList), "cateId");
                    callback(null);
                })
            });
        }
    }

    function _queryCate(callback) {
        if(singleOrchain == "chain"){
            chainDbHelper.queryData("tb_service_cate", {master_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
                _.each(result, _escapeBadCharacter);

                cateList = _filterNoUseKey(result);
                callback(null);
            });
        }else{
            dbHelper.queryData("tb_service_cate", {enterprise_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
                _.each(result, _escapeBadCharacter);

                cateList = _filterNoUseKey(result);
                callback(null);
            });
        }

        function _filterNoUseKey(cateList) {
            var result = [];
            _.each(cateList, function (item) {
                result.push({
                    id: item.id,
                    name: item.name
                });
            });
            return result;
        }
    }

    function _escapeBadCharacter(item){

        if(item.name){
            item.name = item.name.replace("'", "");
            item.name = item.name.replace('"', '');
            item.name = item.name.replace("\'", '');
            item.name = item.name.replace("\"", "");
        }

        if(item.comment){
            item.comment = item.comment.replace("'", "");
            item.comment = item.comment.replace('"', '');
            item.comment = item.comment.replace("\'", '');
            item.comment = item.comment.replace("\"", "");
        }
    }
}

function addShelvesItem(enterpriseId, shelvesList, single_chain, callback) {
    var allOldShelvesItemIdS = [];
    var itemId2OldShelves = {};

    var oldShelves = [];
    var newShelves = [];

    async.series([_queryOldShelves, _spliceOldOrNew, _doAddAndUpdate], callback);

    function _queryOldShelves(callback) {
        dbHelper.queryData("weixin_shelvesItem", {enterprise_id: enterpriseId, status: "inactive"}, function (error, result) {
            if (error) {
                callback(error);
                return;
            }

            _.each(result, function (item) {
                allOldShelvesItemIdS.push(item.itemId);
                itemId2OldShelves[item.itemId] = item;
            });

            callback(null, result);
        });
    }

    function _spliceOldOrNew(callback) {
        _.each(shelvesList, function (item) {
            if (_.contains(allOldShelvesItemIdS, item.itemId)) {
                oldShelves.push({
                    id: itemId2OldShelves[item.itemId].id,
                    status: "active"
                });
            }
            else {
                newShelves.push(item);
            }
        });
        callback(null);
    }

    function _doAddAndUpdate(callback) {
        async.parallel([_doAdd, _doUpdate], callback);

        function _doAdd(callback) {
            async.each(newShelves, _fillItemId, function (error) {
                if (error) {
                    callback(error);
                    return;
                }

                dbHelper.addData("weixin_shelvesItem", newShelves, callback);
            });

            function _fillItemId(item, callback) {
                if(single_chain == "chain"){
                    dbHelper.getUniqueId(enterpriseId, function (error, id) {
                        if (error) {
                            callback(error);
                            return;
                        }

                        item.id = id;
                        item.enterprise_id = enterpriseId;
                        callback(null);
                    });
                }else{
                    dbHelper.getUniqueId(item.enterprise_id, function (error, id) {
                        if (error) {
                            callback(error);
                            return;
                        }

                        item.id = id;
                        callback(null);
                    });
                }

            }
        }

        function _doUpdate(callback) {
            async.each(oldShelves, function (item, callback) {
                if(single_chain == "chain"){
                    item.enterprise_id = enterpriseId;
                    dbHelper.updateByID("weixin_shelvesItem", item, callback);
                }else{
                    dbHelper.updateByID("weixin_shelvesItem", item, callback);
                }
            }, callback);
        }
    }
}

function queryShelvesItem(enterpriseId, single_chain, callback) {
    var itemList = [];
    var shelvesList = [];

    async.parallel([_queryShelves, _queryItemData], function (error) {
        if (error) {
            callback(error);
            return;
        }

        buildShelvesList(shelvesList, itemList, single_chain, enterpriseId, function(error, result){
            callback(null, result);
        })
    });

    function _queryShelves(callback) {
        dbHelper.queryData("weixin_shelvesItem", {enterprise_id: enterpriseId, status: "active"}, function (error, result) {
            if (error) {
                callback(error);
                return;
            }
            shelvesList = result;
            callback(null, result);
        });
    }

    function _queryItemData(callback) {
        if(single_chain == "chain"){
            chainDbHelper.queryData("tb_service", {master_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
                itemList = result;
                callback(null);
            });
        }else{
            dbHelper.queryData("tb_service", {enterprise_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
                itemList = result;
                callback(null);
            });
        }
    }

}

function queryShelvesItem2(enterpriseId, singleOrchain, callback){
    var single_chain = singleOrchain;
    queryShelvesItem(enterpriseId, single_chain, function (error, result) {
        if (error) {
            callback(error);
            return;
        }
        callback(null, result);
    });
}

function queryShelvesByItemId(itemId, singleOrchain, callback) {
    var itemList = [];
    var shelvesList = [];
    var enterpriseId = "";

    async.parallel([_queryShelves, _queryItemData], function (error) {
        if (error) {
            callback(error);
            return;
        }

        buildShelvesList(shelvesList, itemList, singleOrchain, enterpriseId, function(error, result){
            callback(null, result);
        })
    });

    function _queryShelves(callback) {
        dbHelper.queryData("weixin_shelvesItem", {itemId: itemId, status: "active"}, function (error, result) {
            if (error) {
                callback(error);
                return;
            }
            shelvesList = result;
            if(result && result.length > 0){
                enterpriseId = result[0].enterprise_id;
            }
            callback(null, result);
        });
    }

    function _queryItemData(callback) {
        if(singleOrchain == "chain"){
            dohelper(chainDbHelper);
        }else{
            dohelper(dbHelper);
        }
        function dohelper(helper){
            helper.queryData("tb_service", {id: itemId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
                itemList = result;
                if(!enterpriseId && result && result.length > 0){
                    enterpriseId = result[0].enterprise_id;
                }
                callback(null);
            });
        }
    }
}

function searchShelvesByName(enterpriseId, key, callback) {
    var itemList = [];
    var shelvesList = [];

    async.parallel([_queryShelves, _queryItemData], function (error) {
        if (error) {
            callback(error);
            return;
        }

        buildShelvesList(shelvesList, itemList, "", enterpriseId, function(error, resultList){
            var result = _.filter(resultList, function (item) {
                return item.name;
            });

            callback(null, result);
        });
    });

    function _queryShelves(callback) {
        dbHelper.queryData("weixin_shelvesItem", {enterprise_id: enterpriseId, status: "active"}, function (error, result) {
            if (error) {
                callback(error);
                return;
            }
            shelvesList = result;
            callback(null, result);
        });
    }

    function _queryItemData(callback) {
        var sql = "select * from planx_graph.tb_service" +
            " where tb_service.enterprise_id = :enterprise_id and tb_service.name like :name;";

        mysqlProxy.execSql(sql, {enterprise_id: enterpriseId, name: "%" + key + "%"}, function (error, result) {
            if (error) {
                callback(error);
                return;
            }
            itemList = result;
            callback(null);
        });
    }
}

function filterItemNoUseKey(itemList, single_chain, enterpriseId, callback) {
    var result = [];
    var newVersion = true;

    async.series([_checkNewVersion, _build], function(error){
        callback(null, result);
    })

    function _checkNewVersion(callback){
        if(single_chain != "chain"){
            dbHelper.queryData("yls_paymentaccount", {enterpriseId: enterpriseId}, function(error, result){
                if(error){
                    console.error(error);
                }
                else if(result && result.length > 0){
                    newVersion = (result[0].clientAppVersion >= 300);
                }

                callback(null);
            });
        }
        else{
            callback(null);
        }
    }

    function _build(callback){
        _.each(itemList, function (item) {
            var imageUrl ;

            if(single_chain == "chain"){
                if (item.baseInfo_image) {
                    imageUrl =  "http://yilos.oss-cn-hangzhou.aliyuncs.com/" + item.baseInfo_image;
                } else {
                    imageUrl = http_server + "public/wechat/service_default.png";
                }
            }else{
                if (item.baseInfo_image) {
                    if(newVersion){
                        imageUrl =  "http://pic.yilos.com/" + item.enterprise_id + "/service" + item.baseInfo_image.substr(item.baseInfo_image.lastIndexOf("/"));
                    }
                    else{
                        imageUrl =  http_server + "public/mobile/backup/" + item.baseInfo_image;
                    }
                } else {
                    imageUrl = http_server + "public/wechat/service_default.png";
                }
            }

            result.push({
                id: item.id,
                cateId: item.serviceCategory_id,
                name: item.name,
                comment: item.comment,
                enterprise_id: item.enterprise_id,
                //todo replace url
                imgPath: imageUrl
            });
        });

        callback(null);
    }
}

function markItemAlreadyShelves(itemList, shelvesIdList) {
    _.each(itemList, function (item) {
        if (_.contains(shelvesIdList, item.id)) {
            item.alreadyShelves = true;
        }
    });
    return itemList;
}

function buildShelvesList(shelvesList, itemList, single_chain, enterpriseId, callback) {
    var newVersion = true;

    async.series([_checkNewVersion, _build], function(error){
        callback(null, shelvesList);
    })

    function _checkNewVersion(callback){
        if(single_chain != "chain"){
            dbHelper.queryData("yls_paymentaccount", {enterpriseId: enterpriseId}, function(error, result){
                if(error){
                    console.error(error);
                }
                else if(result && result.length > 0){
                    newVersion = (result[0].clientAppVersion >= 300);
                }

                callback(null);
            });
        }
        else{
            callback(null);
        }
    }

    function _build(callback){
        _.each(shelvesList, function (shelves) {
            var item = _.find(itemList, function (item) {
                return item.id === shelves.itemId;
            });

            if (!_.isEmpty(item)) {
                shelves.name = item.name;
                shelves.price = item.prices_salesPrice;

                if(single_chain == "chain"){
                    if (item.baseInfo_image) {
                        shelves.imgPath =  "http://yilos.oss-cn-hangzhou.aliyuncs.com/" + item.baseInfo_image;
                    } else {
                        shelves.imgPath = http_server + "public/wechat/service_default.png";
                    }
                }else{
                    if (item.baseInfo_image) {
                        if(newVersion){
                            shelves.imgPath =  "http://pic.yilos.com/" + item.enterprise_id + "/service" + item.baseInfo_image.substr(item.baseInfo_image.lastIndexOf("/"));
                        }
                        else{
                            shelves.imgPath =  http_server + "public/mobile/backup/" + item.baseInfo_image;
                        }
                    } else {
                        shelves.imgPath = http_server + "public/wechat/service_default.png";
                    }
                }
            }else{

                var sql = "delete from planx_graph.weixin_shelvesItem where itemId = :shelvesItemId";
                dbHelper.execSql(sql, {shelvesItemId: shelves.itemId}, function(err, result){
                    if (err) {
                        return err;
                    }
                });
                shelvesList.splice(shelvesList.indexOf(shelves), 1);
            }
        });

        callback(null);
    }
}
