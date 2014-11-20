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

    var $back = $("#back");
    var $itemDetail = $("#item-detail");

    $back.click(function($event){
        window.history.back();
        $event.stopPropagation();
    });

    $itemDetail.height($(window).height() - $back.height());

    $(".comment").height($itemDetail.height() - $(".img").height() - $(".name-price").height());
}
