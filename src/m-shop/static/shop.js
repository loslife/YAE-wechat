$(function(){

    var enterpriseId = $("#enterprise_id").text();
    var appId = $("#app_id").text();
    var store_type = $("#store_type").text();
    var store_name = $("#store_name").text();
    var store_logUrl = $("#store_logUrl").attr("src");
    var nowUrl = window.location.href;
    var signUrl = "/svc/wsite/" + appId + "/" + enterpriseId + "/sign";

    init();
    var ua = window.navigator.userAgent.toLowerCase();
    if(ua.match(/MicroMessenger/i) == 'micromessenger'){
        initWx();
    }

    function init() {

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

        $("#store_address").click(function () {

            if (!expand) {
                $("#enterpriseMap").addClass("map-expand").removeClass("map-fold");
                $("#mapDiv").addClass("expand");
                $("#switch").prop("src", "/resource/arrow_up.png");
            } else {
                $("#enterpriseMap").addClass("map-fold").removeClass("map-expand");
                $("#mapDiv").removeClass("expand");
                $("#switch").prop("src", "/resource/arrow_down.png");
            }

            expand = !expand;
        });
    }

    function initWx(){

        $.post(signUrl, {url: nowUrl, appId: appId}, function(response){

            var signature = response.sign;

            wx.config({
                debug: false,
                appId: appId,
                timestamp: 1421670369,
                nonceStr: 'q2XFkAiqofKmi1Y2',
                signature: signature,
                jsApiList: [
                    'onMenuShareTimeline',
                    'onMenuShareAppMessage'
                ]
            });

            // 如果是在微信中打开，控制分享行为
            wx.ready(function() {

                var wxData = {
                    "imgUrl": "http://wx.yilos.com" + store_logUrl,   //global["_g_server"].staticurl + "/resource/share_thumb.png",
                    "link": global["_g_server"].wxserviceurl + "/wsite/" + appId + "/" + enterpriseId + "/shop?store_type=" + store_type,
                    "desc": store_name + "-这是一家很棒的店铺噢，推荐给你。",
                    "title": store_name + "-这家店铺超棒！",
                    "appId": appId === "wxb5243e6a07f2e09a" ? "wxf932fcca3e6bf697" : appId
                };

                wx.onMenuShareTimeline(wxData);
                wx.onMenuShareAppMessage(wxData);
            });
        });
    }
});
