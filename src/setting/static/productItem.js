YLSMainModule.controller('allItemController', function ($scope) {

    if (window.pageData) {
        _.extend($scope, JSON.parse(replaceSpecialChar(window.pageData)));
    }

    $scope.view = {};
    $scope.itemList = [];

    $scope.choicesCate = function (cate) {
        $scope.view.lastItemExtraWidth = 0;
        if ($scope.view.cateSelected) {
            $scope.view.cateSelected.selected = false;
        }
        $scope.view.cateSelected = cate;
        cate.selected = true;
        $scope.itemList = _.sortBy($scope.cateId2ItemList[cate.id], function (item) {
            return item.name;
        });

        digestScope();

        setTimeout(function () {
            adjustItemWidth();
            digestScope();
        });
    };

    $scope.shelvesSelect = function (item) {
        if (item.alreadyShelves) {
            return;
        }

        item.shelvesSelected = !item.shelvesSelected;
    };

    $scope.addShelvesItem = function () {
        var shelvesList = [];
        var shelvesSelect = [];

        _buildShelvesItem();
        _add(function (error) {
            if (error) {
                //todo handle error
                return;
            }
            _markItemAlreadyShelves();
            digestScope();
        });


        function _add(callback) {
            $.post("/svc/weixin/addShelvesItem", {shelvesItemList: shelvesList}, function (data) {
                if (data.code == 0) {
                    callback(null, data.result);
                    return;
                }
                callback("上架失败");
            });
        }

        function _buildShelvesItem() {
            _.each($scope.cateId2ItemList, function (serviceList) {

                _.each(serviceList, function(item){

                    if (item.shelvesSelected && !item.alreadyShelves) {
                        shelvesList.push({
                            itemId: item.id,
                            cateId: item.cateId,
                            enterprise_id: item.enterprise_id,
                            comment: item.comment,
                            hot: 0,//代表是否推荐
                            status: "active"//是否处于上架状态
                        });
                        shelvesSelect.push(item);
                    }
                });
            });
        }

        function _markItemAlreadyShelves() {
            _.each(shelvesSelect, function (item) {
                item.alreadyShelves = true;

                if (!$scope.view.cateSelected.selected) {
                    var existCate = _.find($scope.cateId2ItemList[item.cateId], function (cateItem) {
                        return cateItem.id === item.id;
                    });

                    if (!_.isEmpty(existCate)) {
                        existCate.alreadyShelves = true;
                    }
                }
            });
        }
    };

    if (!_.isEmpty($scope.cateList)) {
        $scope.choicesCate($scope.cateList[0]);
    }

    angular.element(document).ready(function () {
        adjustHeight();
        digestScope();
    });

    $(window).resize(function () {
        adjustHeight();
        digestScope();
    });

    function adjustHeight() {
        var itemList = $("#allItem-area .item-list");
        var listHead = $("#allItem-area .item-list-head");
        var cateList = $("#allItem-area .cate-list");
        var item = $("#allItem-area .item-list>li");
        itemList.height($(window).height() - $("#wrapper nav").height() - listHead.outerHeight(true) - cateList.outerHeight(true) - 10);

        adjustItemWidth();
    }

    function adjustItemWidth() {
        $scope.view.lastItemExtraWidth = 0;

        var itemList = $("#allItem-area>.item-list");
        var suitCount = Math.floor((itemList.width()) / 200);
        $scope.view.itemWidth = (Math.floor((itemList[0].scrollWidth - 20) / suitCount));

        var lastLineCount = $scope.itemList.length % suitCount;
        if (lastLineCount !== 0) {
            $scope.view.lastItemExtraWidth = (suitCount - lastLineCount) * $scope.view.itemWidth;
        }
    }

    function digestScope() {
        try {
            $scope.$digest();
        }
        catch (error) {
        }
    }

    function replaceSpecialChar(string) {
        return string.replace(/\n/g, "\\n").replace(/\n\r/g, "\\n\\r");
    }
});