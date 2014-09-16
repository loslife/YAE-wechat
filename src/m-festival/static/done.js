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

    (function(){

        var backH = $("#back").height();
        var windowH = $(window).height();
        var doneHeight = windowH - backH;

        $("#m-festival-done").height(doneHeight);

    })();

    $("#back").on("click", function ($even) {
        location.href = "festival";
        $even.stopPropagation();
    });
}

