YLSMainModule.controller('festivalsController', function ($scope) {

        var jcropApi;

        init();

        function init() {
            cleanMsg();
            $scope.action = "info";
            $scope.states = [
                {value: 0, name: "下线"},
                {value: 1, name: "上线"}
            ];
            $scope.promotes = [
                {value: 0, name: "不推荐"},
                {value: 1, name: "推荐"}
            ];
            $scope.items = [];
            $scope.festivals = [];
            $scope.newFestivals = {title: "", description: "", beginDate: "", endDate: "", limitNumber: 100, rule: "share", present: {}, state: $scope.states[0], promote: $scope.promotes[0]};
            $scope.recordFestivals = null;
            if (window.items) {
                $scope.items = JSON.parse(window.items);
                $scope.newFestivals.present = $scope.items[0];
            }
            if (window.festivals) {
                $scope.festivals = $.parseJSON(window.festivals);//JSON.parse(window.festivals);
            }
            if (window.enterpriseId) {
                $scope.enterpriseId = window.enterpriseId;
                console.log($scope.enterpriseId);
            }
            $("#newSelectedFile").on("change", readURL);
            $("#newBtnSelectFile").on("click", function () {
                $("#newSelectedFile").trigger("click");
            });

            $("#editSelectedFile").on("change", readURL);
            $("#editBtnSelectFile").on("click", function () {
                $("#editSelectedFile").trigger("click");
            });
            digestScope();
        }

        function cleanMsg() {
            $scope.msg = {
                newFestivals: {success: null, error: null},
                editFestivals: {success: null, error: null},
                removeFestivals: {success: null, error: null}
            };
        }

        function _buildFestivalsValidator() {
            return {
                title: {
                    validators: {
                        notEmpty: {
                            message: '请输入标题'
                        },
                        stringLength: {
                            max: 15,
                            message: '标题最多输入15个字符'
                        }
                    }
                },
                description: {
                    validators: {
                        notEmpty: {
                            message: '请输入描述'
                        }
                    }
                },
                limitNumber: {
                    validators: {
                        notEmpty: {
                            message: '请输入优惠活动领取上次次数'
                        },
                        integer: {
                            message: '请输入整数'
                        }
                    }
                },
                present: {
                    validators: {
                        notEmpty: {
                            message: "必须选择优惠活动赠送礼品，在美业管家中添加"
                        }
                    }
                }
            }
        }

        $("#newFestivalsForm").bootstrapValidator({
            fields: _buildFestivalsValidator()
        }).on('success.form.bv', function (e) {
            e.preventDefault();
            var data = $(e.target).serialize()
            var beginDate = getParamValue("beginDate", data);
            var endDate = getParamValue("endDate", data);
            var festivals = $scope.newFestivals;
            if (promoteFestivalsCount(null) >= 2 && festivals.promote.value == 1) {
                cleanMsg();
                $scope.msg.newFestivals.error = "新增失败，最多只能同时存在两个推荐优惠活动，请修改推荐状态";
                $('#newFestivalsForm').data('bootstrapValidator').resetForm();
                digestScope();
                return;
            }
            var present = festivals.present;
            var result = {
                title: festivals.title || "",
                description: festivals.description || "",
                beginDate: beginDate || "",
                endDate: endDate || "",
                limitNumber: festivals.limitNumber,
                rule: festivals.rule || "share",
                presentId: present ? present.id || "" : "",
                presentName: present ? present.name || "" : "",
                presentType: present ? present.type || "" : "",
                state: festivals.state.value || 0,
                promote: festivals.promote.value || 0
            }
            var target;
            if ($scope.action == 'new') {
                target = $("#newTarget");
            } else if ($scope.action == 'edit') {
                target = $("#editTarget");
            }
            if (target) {
                var imgContent = {};
                var temp = target.attr("src");
                if (jcropApi) {
                    imgContent.suffix = temp.substring(temp.indexOf("image/") + 6, temp.indexOf(";"));
                    imgContent.data = temp.substr(temp.indexOf(";") + 8);
                    imgContent.position = jcropApi.tellScaled();
                    result.image = imgContent;
                }
            }
            newFestivals(result);
        });

        function newFestivals(data) {
            cleanMsg();
            $.post("/svc/weixin/newFestivals", data, function (data) {
                if (data.code === 0) {
                    $scope.msg.newFestivals.success = "添加优惠活动成功";
                    setTimeout(function () {
                        $scope.action = 'info';
                        digestScope();
                        location.reload();
                        cleanMsg();
                    }, 1000);
                } else {
                    $scope.msg.newFestivals.error = data.errorMsg || "添加优惠活动失败";
                }
                digestScope();
            });
        }

        $("#editFestivalsForm").bootstrapValidator({
            fields: _buildFestivalsValidator()
        }).on('success.form.bv', function (e) {
            e.preventDefault();
            var data = $(e.target).serialize()
            var beginDate = getParamValue("beginDate", data);
            var endDate = getParamValue("endDate", data);
            var festivals = $scope.recordFestivals;
            if (promoteFestivalsCount(festivals.id) >= 2 && festivals.promote.value == 1) {
                cleanMsg();
                $scope.msg.editFestivals.error = "修改失败，最多只能同时存在两个推荐优惠活动，请修改推荐状态";
                $('#editFestivalsForm').data('bootstrapValidator').resetForm();
                digestScope();
                return;
            }
            var present = festivals.present;
            var result = {
                id: festivals.id,
                title: festivals.title || "",
                description: festivals.description || "",
                beginDate: beginDate || "",
                endDate: endDate || "",
                limitNumber: festivals.limit_number,
                rule: festivals.rule || "share",
                presentId: present ? present.id || "" : "",
                presentName: present ? present.name || "" : "",
                presentType: present ? present.type || "" : "",
                state: festivals.state.value || 0,
                promote: festivals.promote.value || 0
            }
            var target;
            if ($scope.action == 'new') {
                target = $("#newTarget");
            } else if ($scope.action == 'edit') {
                target = $("#editTarget");
            }


            if (target) {
                var imgContent = {};
                var temp = target.attr("src");
                if (jcropApi) {
                    imgContent.suffix = temp.substring(temp.indexOf("image/") + 6, temp.indexOf(";"));
                    imgContent.data = temp.substr(temp.indexOf(";") + 8);
                    imgContent.position = jcropApi.tellScaled();
                    result.image = imgContent;
                }
            }

            if (!_validateImageSize()) {
                return;
            }

            editFestivals(result);
        });


        function _validateImageSize() {

            var maxsize = 2*1024*1024;//2M
            var errMsg = "上传的图片不能超过2M"
            var tipMsg = "您的浏览器暂不支持计算上传文件的大小，确保上传文件不要超过2M，建议使用IE、FireFox、Chrome浏览器。"
            var browserCfg = {};
            var ua = window.navigator.userAgent;

            if (ua.indexOf("MSIE")>=1){
                browserCfg.ie = true;
            }else if (ua.indexOf("Firefox")>=1){
                browserCfg.firefox = true;
            }else if (ua.indexOf("Chrome")>=1){
                browserCfg.chrome = true;
            }else{
                browserCfg.firefox = true;
            }


            try{
                var obj_file = document.getElementById("editSelectedFile");
                var filesize = 0;

                if(!obj_file.files[0]){
                    return true;
                }

                if (browserCfg.firefox || browserCfg.chrome ){
                    filesize = obj_file.files[0].size;

                }else if(browserCfg.ie){
                    var obj_img = document.getElementById("editTarget");
                    obj_img.dynsrc = obj_file.value;
                    filesize = obj_img.fileSize;
                }else {
                    alert(tipMsg);
                    return;
                }

                if (filesize == -1){
                    alert(tipMsg);
                    return false;
                }else if (filesize > maxsize){
                    alert(errMsg);
                    return false;
                }else {
                    return true;
                }
            }catch(e){
                alert(e);
            }
        }



        function editFestivals(data) {
            cleanMsg();
            $.post("/svc/weixin/editFestivals", data, function (data) {
                if (data.code === 0) {
                    $scope.msg.editFestivals.success = "修改优惠活动成功";
                    setTimeout(function () {
                        $('#editFestivalsForm').data('bootstrapValidator').resetForm();
                        $scope.action = 'info';
                        digestScope();
                        location.reload();
                        cleanMsg();
                    }, 1000);
                } else {
                    $scope.msg.editFestivals.error = "修改优惠活动失败";
                    $('#editFestivalsForm').data('bootstrapValidator').resetForm();
                }
                digestScope();
            });
        }

        $scope.recordData = function (record, action) {
            $scope.action = action;
            $scope.recordFestivals = JSON.parse(JSON.stringify(record));
            var items = $scope.items || [];
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (record.present_id == item.id && record.present_type == item.type) {
                    $scope.recordFestivals.present = item;
                    break;
                }
            }
            if (!$scope.recordFestivals.present) {
                $scope.recordFestivals.present = {};
            }
            for (var i = 0; i < $scope.states.length; i++) {
                var item = $scope.states[i];
                if (item.value == record.state) {
                    $scope.recordFestivals.state = item;
                    break;
                }
            }
            for (var i = 0; i < $scope.promotes.length; i++) {
                var item = $scope.promotes[i];
                if (item.value == record.promote) {
                    $scope.recordFestivals.promote = item;
                    break;
                }
            }
            $scope.recordFestivals.rule = $scope.recordFestivals.rule || "share";
            digestScope();
        }

        $scope.changeAction = function (action) {
            $scope.action = action;
            $scope.recordFestivals = null;
            if (jcropApi) {
                jcropApi.destroy();
                jcropApi = null;
            }
            $("#newTarget").attr("src", "");
            $("#newTarget").attr("style", "");
            $("#editTarget").attr("src", "");
            $("#editTarget").attr("style", "");
            cleanMsg();
            digestScope();
        }

        $scope.updateState = function (item, state) {
            var id = item ? item.id : "";
            var promote = item ? item.promote : 0;
            $.post("/svc/weixin/updateState", {id: id, state: state, promote: promote}, function (data) {
                if (data.code === 0) {
                    alert(state == 1 ? "活动上线成功" : "活动下线成功");
                } else {
                    alert(state == 1 ? "活动上线失败" : "活动下线失败");
                }
                location.reload();
            });
        }

        $scope.updatePromoteState = function (item, promote) {
            if (promoteFestivalsCount() >= 2 && promote == 1) {
                alert("推荐失败，最多只能同时存在两个推荐优惠活动！");
                return;
            }
            var id = item ? item.id : "";
            var state = item ? item.state : 0;
            $.post("/svc/weixin/updatePromoteState", {id: id, state: state, promote: promote}, function (data) {
                if (data.code === 0) {
                    alert(promote == 1 ? "推荐成功" : "取消推荐成功");
                } else {
                    alert(promote == 1 ? "推荐失败" : "取消推荐失败");
                }
                location.reload();
            });
        }

        function promoteFestivalsCount(notIncludeFestivalsId) {
            var promoteFestivalsCount = 0;
            var festivals = $scope.festivals;
            if (festivals && festivals.length > 0) {
                for (var i = 0; i < festivals.length; i++) {
                    if (festivals[i].promote == "1" && notIncludeFestivalsId != festivals[i].id) {
                        promoteFestivalsCount++;
                    }
                }
            }
            return promoteFestivalsCount;
        }

        function readURL($event) {
            var target;
            if ($scope.action == 'new') {
                target = $("#newTarget");
            } else if ($scope.action == 'edit') {
                target = $("#editTarget");
            } else {
                return;
            }

            target.css("width", "auto").css("height", "auto");
            if (jcropApi) {
                jcropApi.destroy();
            }
            if ($event.target.files && $event.target.files[0]) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    target.attr("src", e.target.result);
                    var options = {
                        allowSelect: false,
                        aspectRatio: 2
                    };
                    target.Jcrop(options, function () {
                        jcropApi = this;
                        jcropApi.animateTo([10, 10, 400, 200]);
                    });
                };
                reader.readAsDataURL($event.target.files[0]);
            }
        }

        function digestScope() {
            try {
                $scope.$digest();
            } catch (error) {

            }
        }

        function getParamValue(paramName, result) {
            var rs = new RegExp("(^|)" + paramName + "=([^\&]*)(\&|$)", "gi").exec(result);
            var tmp;
            if (tmp = rs) {
                return tmp[2];
            }
            return "";
        }
    }
)
;