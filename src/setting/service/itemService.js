var itemDao = require("./itemDao");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();

exports.allItem = allItem;
exports.shelvesItem = shelvesItem;
exports.addShelvesItem = addShelvesItem;

exports.searchItem = searchItem;
exports.searchShelves = searchShelves;

exports.queryAllShelvesItem = queryAllShelvesItem;
exports.queryShelvesByItemId = queryShelvesByItemId;

exports.updateShelves = updateShelves;

function allItem(req, res, next) {
    var enterpriseId = req.session.enterpriseId;
    var single_chain = req.session.single_chain;

    var data = {
        layout: "storeadmin_layout",
        menu: "allItem",
        storeName: req.session.storeName
    };

    itemDao.queryAllItem(enterpriseId, single_chain, function (error, cateList, cateId2ItemList) {
        if (error) {
            logger.error(error);
            next(error);
            return;
        }
        res.render("allItem", _.extend(data, {cateList: cateList, cateId2ItemList: cateId2ItemList}));
    });
}

function shelvesItem(req, res, next) {
    var enterpriseId = req.session.enterpriseId;
    var single_chain = req.session.single_chain;

    var data = {
        layout: "storeadmin_layout",
        menu: "shelvesItem",
        storeName: req.session.storeName
    };

    itemDao.queryShelvesItem2(enterpriseId, single_chain, function (error, result) {
        if (error) {
            logger.error(error);
            next(error);
            return;
        }
        res.render("shelvesItem", _.extend(data, {shelvesList: result}));
    });
}

function addShelvesItem(req, res, next) {
    var enterpriseId = req.session.enterpriseId;
    var shelvesItemList = req.body.shelvesItemList || [];
    var single_chain = req.session.single_chain;

    itemDao.addShelvesItem(enterpriseId, shelvesItemList, single_chain, function (error) {
        if (error) {
            logger.error(error);
            next(error);
            return;
        }
        doResponse(req, res, {code: 0});
    });
}

function queryAllShelvesItem(req, res, next) {
    var enterpriseId = req.params.enterpriseId;
    var single_chain = req.query["store_type"];

    itemDao.queryShelvesItem2(enterpriseId, single_chain, function (error, result) {
        if (error) {
            logger.error(error);
            next(error);
            return;
        }
        doResponse(req, res, {code: 0, result: result});
    });
}

function queryShelvesByItemId(req, res, next) {
    var itemId = req.params.itemId;
    var single_chain = req.query["store_type"];
    itemDao.queryShelvesByItemId(itemId, single_chain, function (error, result) {
        if (error) {
            logger.error(error);
            next(error);
            return;
        }
        doResponse(req, res, {code: 0, result: result});
    });
}

function updateShelves(req, res, next) {
    var itemList = req.body.itemList || [];

    async.each(itemList, _doUpdate, function (error) {
        if (error) {
            logger.error(error);
            next(error);
            return;
        }
        doResponse(req, res, {code: 0});
    });

    function _doUpdate(item, callback) {
        dbHelper.updateByID("weixin_shelvesItem", item, callback);
    }
}

function searchItem(req, res, next) {
    var enterpriseId = req.session.enterpriseId;
    var key = req.param("key") || "";

    itemDao.searchItem(enterpriseId, key, function (error, result) {
        if (error) {
            logger.error(error);
            next(error);
            return;
        }
        doResponse(req, res, {code: 0, result: result});
    });
}

function searchShelves(req, res, next) {
    var enterpriseId = req.session.enterpriseId;
    var key = req.param("key") || "";

    itemDao.searchShelvesByName(enterpriseId, key, function (error, result) {
        if (error) {
            logger.error(error);
            next(error);
            return;
        }
        doResponse(req, res, {code: 0, result: result});
    });
}
