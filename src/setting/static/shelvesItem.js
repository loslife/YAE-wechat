YLSMainModule.controller('shelvesItemController', function ($scope) {

    if (window.pageData) {
        _.extend($scope, JSON.parse(replaceSpecialChar(window.pageData)));

        $scope.shelvesList = _.sortBy($scope.shelvesList, function (item) {
            return item.name;
        });
    }

    $scope.addHotItem = function () {
        var selectItemList = _.filter($scope.shelvesList, function (item) {
            return item.selected;
        });

        var itemList = [];
        _.each(selectItemList, function (item) {
            itemList.push({
                id: item.id,
                hot: 1
            });
        });

        updateShelves(itemList, function (error) {
            if (error) {
                return;
            }
            _.each(selectItemList, function (item) {
                item.hot = 1;
                item.selected = false;
            });
            digestScope();
        });
    };

    $scope.delHotItem = function () {
        var selectItemList = _.filter($scope.shelvesList, function (item) {
            return item.selected;
        });

        var itemList = [];
        _.each(selectItemList, function (item) {
            itemList.push({
                id: item.id,
                hot: 0
            });
        });

        updateShelves(itemList, function (error) {
            if (error) {
                return;
            }
            _.each(selectItemList, function (item) {
                item.hot = 0;
                item.selected = false;
            });
            digestScope();
        });
    };

    $scope.delShelvesItem = function () {
        var selectItemList = _.filter($scope.shelvesList, function (item) {
            return item.selected;
        });

        var itemList = [];
        _.each(selectItemList, function (item) {
            itemList.push({
                id: item.id,
                status: "inactive"
            });
        });

        updateShelves(itemList, function (error) {
            if (error) {
                return;
            }
            $scope.shelvesList = _.filter($scope.shelvesList, function (item) {
                return !item.selected;
            });
            digestScope();
        });
    };

    $scope.selectItem = function (item) {
        item.selected = !item.selected;
    };

    $scope.commentEditInit = function (item) {
        if ($scope.commentEditInit.preItem) {
            $scope.commentEditInit.preItem.isEditing = false;
        }
        $scope.commentEditInit.preItem = item;

        item.isEditing = true;
        item.commentEdit = item.comment;
    };

    $scope.commentEditCommit = function (item) {


        var itemEdit = {
            id: item.id,
            comment: item.commentEdit
        };

        $.post("/svc/weixin/updateShelves", {itemList: [itemEdit]}, function (data) {
            if (data.code === 0) {
                item.isEditing = false;
                item.comment = itemEdit.comment;
                digestScope();
                return;
            }

            alert("修改失败");
        });
    };

    angular.element(document).ready(function () {
        digestScope();
    });

    function updateShelves(itemList, callback) {
        if (_.isEmpty(itemList)) {
            callback(null);
            return;
        }
        $.post("/svc/weixin/updateShelves", {itemList: itemList}, function (data) {
            callback(data.code != 0);
        });
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