function onBridgeReady() {
    WeixinJSBridge.call('hideOptionMenu');
}

if (typeof WeixinJSBridge == "undefined") {
    if (document.addEventListener) {
        document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
    } else if (document.attachEvent) {
        document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
        document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
    }
} else {
    onBridgeReady();
}

$(function () {
    $(".panel-head").click(function (e) {
        var head = $(e.target);
        var img = head.children('span').children('img');
        if (head.hasClass("expand")) {
            head.removeClass("expand");
            img.attr("src", "/resource/expand.png");
        } else {
            head.addClass("expand");
            img.attr("src", "/resource/collapse.png");
        }
    });
});