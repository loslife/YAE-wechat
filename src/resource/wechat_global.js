var g_env = {
    security_code_url: "http://192.168.1.106:3000/svc/getCode/",
    check_code_url: "http://192.168.1.106:3000/svc/checkCode/",
    binding_url: "http://192.168.1.106:5000/svc/wsite/"
};

function adjustMenuPosition(){

    var menuH = $("#menu").height();
    var windowH = $(window).height();
    var contentH = windowH - menuH;

    $("#content").height(contentH);
}

if(WeixinApi.openInWeixin()){

    if (typeof WeixinJSBridge == "undefined") {
        if (document.addEventListener) {
            document.addEventListener('WeixinJSBridgeReady', adjustMenuPosition, false);
        } else if (document.attachEvent) {
            document.attachEvent('WeixinJSBridgeReady', adjustMenuPosition);
            document.attachEvent('onWeixinJSBridgeReady', adjustMenuPosition);
        }
    } else {
        adjustMenuPosition();
    }

}else{

    $(function(){
        adjustMenuPosition();
    });
}