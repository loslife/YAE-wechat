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

var single_chain = null;
function searchItem(enterpriseId, key, callback) {
    var shelvesIdList = [];
    var searchResult = [];

    async.series([_queryShelves, _searchItem], function (error) {
        callback(error, searchResult);
    });

    function _queryShelves(callback) {
        queryShelvesItem(enterpriseId, function (error, result) {
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
            searchResult = markItemAlreadyShelves(filterItemNoUseKey(result), shelvesIdList);
            callback(null);
        });
    }
}

function queryAllItem(enterpriseId, singleOrchain, callback) {
    var cateId2ItemList = {};
    var shelvesIdList = [];
    var cateList = [];
    single_chain = singleOrchain;
    async.series([_queryShelves, _queryItem, _queryCate], function (error) {
        callback(error, cateList, cateId2ItemList);
    });

    function _queryShelves(callback) {
        queryShelvesItem(enterpriseId, function (error, result) {
            if (error) {
                callback(error);
                return;
            }
            shelvesIdList = _.pluck(result, "itemId");
            callback(null);
        });
    }

    function _queryItem(callback) {
        if(single_chain == "chain"){
            chainDbHelper.queryData("tb_service", {master_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }

                cateId2ItemList = _.groupBy(markItemAlreadyShelves(filterItemNoUseKey(result), shelvesIdList), "cateId");
                callback(null);
            });
        }else{
            dbHelper.queryData("tb_service", {enterprise_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }

                cateId2ItemList = _.groupBy(markItemAlreadyShelves(filterItemNoUseKey(result), shelvesIdList), "cateId");
                callback(null);
            });
        }
    }

    function _queryCate(callback) {
        if(single_chain == "chain"){
            chainDbHelper.queryData("tb_service_cate", {master_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
                cateList = _filterNoUseKey(result);
                callback(null);
            });
        }else{
            dbHelper.queryData("tb_service_cate", {enterprise_id: enterpriseId}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
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
}

function addShelvesItem(enterpriseId, shelvesList, callback) {
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

        function _doUpdate(callback) {
            async.each(oldShelves, function (item, callback) {
                dbHelper.updateByID("weixin_shelvesItem", item, callback)
            }, callback);
        }
    }
}

function queryShelvesItem(enterpriseId, callback) {
    var itemList = [];
    var shelvesList = [];

    async.parallel([_queryShelves, _queryItemData], function (error) {
        if (error) {
            callback(error);
            return;
        }
        callback(null, buildShelvesList(shelvesList, itemList));
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
        if(single_chain == "chain"){      //|| single_chain == undefined
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
    single_chain = singleOrchain;
    queryShelvesItem(enterpriseId, function (error, result) {
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
    single_chain = singleOrchain;

    async.parallel([_queryShelves, _queryItemData], function (error) {
        if (error) {
            callback(error);
            return;
        }
        callback(null, buildShelvesList(shelvesList, itemList));
    });

    function _queryShelves(callback) {
        dbHelper.queryData("weixin_shelvesItem", {itemId: itemId, status: "active"}, function (error, result) {
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

        var result = _.filter(buildShelvesList(shelvesList, itemList), function (item) {
            return item.name;
        });

        callback(null, result);
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

function filterItemNoUseKey(itemList) {
    var result = [];
    _.each(itemList, function (item) {
        var imageUrl ;
        if (item.baseInfo_image) {
            imageUrl =  http_server + "public/mobile/backup/" + item.baseInfo_image;
        } else {
            imageUrl = http_server + "public/wechat/service_default.png";
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
    return result;
}

function markItemAlreadyShelves(itemList, shelvesIdList) {
    _.each(itemList, function (item) {
        if (_.contains(shelvesIdList, item.id)) {
            item.alreadyShelves = true;
        }
    });
    return itemList;
}

function buildShelvesList(shelvesList, itemList) {
    _.each(shelvesList, function (shelves) {
        var item = _.find(itemList, function (item) {
            return item.id === shelves.itemId;
        });

        if (!_.isEmpty(item)) {
            shelves.name = item.name;
            shelves.price = item.prices_salesPrice;

            if (item.baseInfo_image) {
                shelves.imgPath =  http_server + "public/mobile/backup/" + item.baseInfo_image;
            } else {
                shelves.imgPath = http_server + "public/wechat/service_default.png";
            }
        }
    });
    return shelvesList;
}
