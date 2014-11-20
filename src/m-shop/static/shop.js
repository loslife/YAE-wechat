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

    var expand = false;

    var storeAddr = $("#store_addr").text();

    var map = new BMap.Map("enterpriseMap");
    var myGeo = new BMap.Geocoder();

    myGeo.getPoint(storeAddr, function (point) {

        if (point) {
            map.centerAndZoom(point, 14);
            map.addOverlay(new BMap.Marker(point));
        } else {
            $("#mapDiv").addClass("none");
        }
    }, "");

    $("#store_address").click(function(){

        if(!expand){
            $("#enterpriseMap").addClass("map-expand").removeClass("map-fold");
            $("#mapDiv").addClass("expand");
            $("#switch").prop("src", "/resource/arrow_up.png");
        }else{
            $("#enterpriseMap").addClass("map-fold").removeClass("map-expand");
            $("#mapDiv").removeClass("expand");
            $("#switch").prop("src", "/resource/arrow_down.png");
        }

        expand = !expand;
    });

    // 如果是在微信中打开，控制分享行为
    WeixinApi.ready(function(Api) {

        attachShareCallback();

        function attachShareCallback(){

            var enterpriseId = $("#enterprise_id").text();

            var wxData = {
                "imgUrl": global["_g_server"].staticurl + "/resource/share_thumb.png",
                "link": global["_g_server"].wxserviceurl + "/wsite/" + enterpriseId + "/shop",
                "desc": "发现一家很棒的美甲店噢，推荐给你",
                "title": "这家美甲店不错",
                "appId": "wxf932fcca3e6bf697"
            };

            Api.shareToTimeline(wxData);
            Api.shareToFriend(wxData);
        }
    });
}