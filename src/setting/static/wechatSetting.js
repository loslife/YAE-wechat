$(function () {
    var jcropApi;

    $("#welcomeSubmit").on("click", submitWelCome);

    $("#fileSelect").on("change", readURL);

    $("#fileUpload").on("click", uploadImg);

    $("#fileSelectWrap").on("click", function () {
        $("#fileSelect").trigger("click");
    });

    function submitWelCome() {
        var welcomeWord = $("#welcomeWord").val();
        $.post("/svc/weixin/updateWechatSetting", {store: {id: storeId, welcomeWord: welcomeWord}}, function (data) {
            if (data.code == 0) {
                alert("设置欢迎语成功");
            } else {
                alert("设置欢迎语失败");
            }
        });
    }

    function readURL($event) {
        $(".homeImgTips").removeClass("homeImgTips");
        $(".jcrop-holder").remove();
        $("#target").css("width", "50%").css("height", "auto");

        if (jcropApi) {
            jcropApi.destroy();
        }

        if ($event.target.files && $event.target.files[0]) {

            var reader = new FileReader();

            reader.onload = function (e) {
                $("#target").attr("src", e.target.result);

                var options = {
                    allowSelect: false,
                    aspectRatio: 3
                };

                $('#target').Jcrop(options, function () {
                    jcropApi = this;
                    jcropApi.animateTo([50, 50, 600, 200]);
                });
            };

            reader.readAsDataURL($event.target.files[0]);
        }
    }

    function uploadImg($event) {
        var imgContent = {};

        var temp = $("#target").attr("src");
        if (!jcropApi) {
            return;
        }

        imgContent.suffix = temp.substring(temp.indexOf("image/") + 6, temp.indexOf(";"));
        imgContent.data = temp.substr(temp.indexOf(";") + 8);
        imgContent.position = jcropApi.tellScaled();


        _reCalculatePositionInfo();

        if (!_validateImageSize()) {
            return;
        }

        var mask = $('#upload-mask').show();
        $.post("/svc/weixin/uploadWechatHomeImg", {image: imgContent}, function (data) {
            if (data.code != 0) {
                alert("上传图片失败");
            }

            jcropApi.destroy();
            jcropApi = null;
            $(".homeImgTips").removeClass("homeImgTips");
            $(".jcrop-holder").remove();
            $("#target").attr("src", data.path).css("width", "50%").css("visibility", "visible").css("display", "inline-block");
            mask.hide();
        });

        function _reCalculatePositionInfo() {
            var ratio = imgRealWidth() / imgWidthOnScreen();

            imgContent.position.x *= ratio;
            imgContent.position.y *= ratio;

            imgContent.position.w *= ratio;
            imgContent.position.h *= ratio;
        }

        function _validateImageSize() {
            var maxsize = 2 * 1024 * 1024;//2M
            var errMsg = "上传的图片不能超过2M";
            var tipMsg = "您的浏览器暂不支持计算上传文件的大小，确保上传文件不要超过2M，建议使用IE、FireFox、Chrome浏览器。"
            var browserCfg = {};
            var ua = window.navigator.userAgent;

            if (ua.indexOf("MSIE") >= 1) {
                browserCfg.ie = true;
            } else if (ua.indexOf("Firefox") >= 1) {
                browserCfg.firefox = true;
            } else if (ua.indexOf("Chrome") >= 1) {
                browserCfg.chrome = true;
            } else {
                browserCfg.firefox = true;
            }

            try {
                var obj_file = document.getElementById("fileSelect");
                var filesize = 0;

                if (browserCfg.firefox || browserCfg.chrome) {
                    filesize = obj_file.files[0].size;
                    //alert(filesize);
                } else if (browserCfg.ie) {
                    var obj_img = document.getElementById("target");
                    obj_img.dynsrc = obj_file.value;
                    filesize = obj_img.fileSize;
                } else {
                    alert(tipMsg);
                    return;
                }

                if (filesize == -1) {
                    alert(tipMsg);
                    return false;
                } else if (filesize > maxsize) {
                    alert(errMsg);
                    return false;
                } else {
                    return true;
                }
            } catch (e) {
                alert(e);
            }
        }
    }


    function imgRealWidth() {
        var img = new Image();
        img.src = $('#target').attr("src");
        return img.width;
    }

    function imgWidthOnScreen() {
        return $("#target").width();
    }
});

