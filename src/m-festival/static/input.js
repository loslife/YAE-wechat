if(WeixinApi.openInWeixin()){

    if (typeof WeixinJSBridge == "undefined") {
        if (document.addEventListener) {
            document.addEventListener('WeixinJSBridgeReady', init, false);
        } else if (document.attachEvent) {
            document.attachEvent('WeixinJSBridgeReady', init);
            document.attachEvent('onWeixinJSBridgeReady', init);
        }
    } else {
        init();
    }

}else{

    $(function(){
        init();
    });
}

function init(){

    $("#btn_get").prop("disabled", false);

    // 手机上弹出键盘时，底部按钮遮挡的问题
    $("#input_phone").focus(function(){
        $("#back").removeClass("fixed-bottom0");
    }).blur(function(){
            $("#back").addClass("fixed-bottom0");
        });

    $("#present_form").submit(function($event){

        $event.preventDefault();

        var phone = $("#input_phone").val();

        if (!phone) {
            alert("请输入手机号");
            return;
        }

        if(!_checkPhone()){
            alert("手机号有误，请重新输入");
            return;
        }

        var enterprise_id = $("#enterprise_id").text();
        var festival_id = $("#festival_id").text();
        var app_id = $("#app_id").text();

        var url = "/svc/wsite/" + app_id + "/" + enterprise_id + "/festival/getPresent?fid=" + festival_id;

        $.post(url, {phone: phone}, function (response) {

            var code = response.code;

            if(code !== 0){
                alert("领取失败，请联系客服");
                return;
            }

            var status = response.result.status;

            if(status === 1){
                location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + app_id + "&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fwsite%2F" + app_id + "%2F" + enterprise_id +"%2Ffestival%2FdoneRoute&response_type=code&scope=snsapi_base&state=success#wechat_redirect";
            }else{
                location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + app_id + "&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fwsite%2F" + app_id + "%2F" + enterprise_id +"%2Ffestival%2FdoneRoute&response_type=code&scope=snsapi_base&state=repeat#wechat_redirect";
            }
        });

        function _checkPhone(){
            return (/^13\d{9}$/g.test(phone) || (/^15\d{9}$/g.test(phone)) || (/^18\d{9}$/g.test(phone)) || (/^17\d{9}$/g.test(phone)));
        }
    });

    $("#back").on("click", function ($even) {
        location.href = "../festival";
        $even.stopPropagation();
    });

    // 如果是在微信中打开
    WeixinApi.ready(function(Api) {

        attachShareCallback();

        function attachShareCallback(){

            var enterpriseId = $("#enterprise_id").text();
            var festivalId = $("#festival_id").text();
            var storeName = $(".store-name").text();
            var festivalTitle = $("#f_title").text();
            var festivalDesc = $("#f_desc").text();
            var app_id = $("#app_id").text();

            var wxData = {
                "imgUrl": global["_g_server"].staticurl + "/resource/share_thumb.png",
                "link": global["_g_server"].wxserviceurl + "/wsite/" + app_id + "/" + enterpriseId + "/festival/route?fid=" + festivalId,
                "desc": festivalDesc,
                "title": storeName + "·" + festivalTitle,
                "appId": "wxf932fcca3e6bf697"
            };

            var wxCallbacks = {

                confirm: function(resp) {
                    var shareCountURL = "/svc/wsite/" + app_id + "/" + enterpriseId + "/festival/countShare?fid=" + festivalId;
                    $.post(shareCountURL, {}, function(response){});
                }
            };

            Api.shareToTimeline(wxData, wxCallbacks);
            Api.shareToFriend(wxData);
        }
    });
}