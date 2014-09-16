function onBridgeReady() {
    WeixinJSBridge.call('showOptionMenu');
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
        if (head[0].nodeName == "SPAN" || head[0].nodeName == "IMG") {
            head = head.parent();
        }
        if (head[0].nodeName == "SPAN") {
            head = head.parent();
        }
        var img = head.children('span').children('img');
        if (head.hasClass("expand")) {//收起
            head.removeClass("expand");
            head.removeClass("border-bottom");
            img.attr("src", "/resource/expand.png");
        } else {//展开
            head.addClass("expand");
            head.addClass("border-bottom");
            img.attr("src", "/resource/collapse.png");
        }
    });
});