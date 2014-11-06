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
        $("#mapDiv").toggle();
    });
}