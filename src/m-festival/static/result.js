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

    var type = $("#type").text();
    if(type === "success"){
        $("body").addClass("success");
    }else{
        $("body").addClass("duplicate");
    }

    $("#back").on("click", function ($even) {
        location.href = "festival";
        $even.stopPropagation();
    });
}
