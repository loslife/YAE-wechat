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

    $("#back").on("click", function ($even) {
        location.href = "festival";
        $even.stopPropagation();
    });

    // 如果是在微信中打开
    WeixinApi.ready(function(Api) {

        $("#btn_share").tap(function(){

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
            var slogan = $("#slogan").text();

            var wxData = {
                "imgUrl": global["_g_server"].staticurl + "/resource/share_thumb.png",
                "link": global["_g_server"].wxserviceurl + "/wsite/" + enterpriseId + "/route?fid=" + festivalId,
                "desc" : slogan,
                "title": "送你一份好礼",
                "appId": "wxb5243e6a07f2e09a"
            };

            var wxCallbacks = {

                confirm: function(resp) {

                    var url = "/svc/wsite/" + enterpriseId + "/getPresent?fid=" + festivalId;

                    $.post(url, {}, function (response) {

                        var status = response.result.status;
                        if(status === 1){
                            location.href = "done";
                        }
                    });

                    var shareCountURL = "/svc/wsite/" + enterpriseId + "/countShare?fid=" + festivalId;
                    $.post(shareCountURL, {}, function(response){});
                }
            };

            Api.shareToTimeline(wxData, wxCallbacks);
            Api.shareToFriend(wxData);
        }
    });
}
