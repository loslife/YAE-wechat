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

    $("#btn_share").prop("disabled", false);

    $("#back").on("click", function ($even) {
        location.href = "../festival";
        $even.stopPropagation();
    });

    // 如果是在微信中打开
    WeixinApi.ready(function(Api) {

        $("#btn_share").click(function(){

            var windowHeight = $(window).height();
            var contentHeight = $("#content").height();
            var max = Math.max(windowHeight, contentHeight);

            $("#share_tips").height(max).show().tap(function(){
                $(this).hide();
            });
        });

        attachShareCallback();

        function attachShareCallback(){

            var enterpriseId = $("#enterprise_id").text();
            var festivalId = $("#festival_id").text();
            var storeName = $(".store-name").text();
            var festivalTitle = $("#f_title").text();
            var festivalDesc = $("#f_desc").text();
            var app_id = $("#app_id").text();

            var friendData = {
                "imgUrl": global["_g_server"].staticurl + "/resource/share_thumb.png",
                "link": global["_g_server"].wxserviceurl + "/wsite/" + app_id + "/" + enterpriseId + "/festival/route?fid=" + festivalId,
                "desc": festivalDesc,
                "title": storeName + "·" + festivalTitle,
                "appId": "wxf932fcca3e6bf697"
            };

            var timelineData = {
                "imgUrl": global["_g_server"].staticurl + "/resource/share_thumb.png",
                "link": global["_g_server"].wxserviceurl + "/wsite/" + app_id + "/" + enterpriseId + "/festival/route?fid=" + festivalId,
                "desc": storeName + " | " + festivalTitle + "：" + festivalDesc,
                "title": storeName + "·" + festivalTitle,
                "appId": "wxf932fcca3e6bf697"
            };

            var wxCallbacks = {

                confirm: function(resp) {

                    var url = "/svc/wsite/" + app_id + "/" + enterpriseId + "/festival/getPresent?fid=" + festivalId;

                    $.post(url, {}, function (response) {

                        var status = response.result.status;
                        if(status === 1){
                            location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + app_id + "&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fwsite%2F" + app_id + "%2F"+ enterpriseId +"%2Ffestival%2FdoneRoute&response_type=code&scope=snsapi_base&state=success#wechat_redirect";
                        }
                    });

                    var shareCountURL = "/svc/wsite/" + app_id + "/" + enterpriseId + "/festival/countShare?fid=" + festivalId;
                    $.post(shareCountURL, {}, function(response){});
                }
            };

            Api.shareToTimeline(timelineData, wxCallbacks);
            Api.shareToFriend(friendData, {});
        }
    });
}
