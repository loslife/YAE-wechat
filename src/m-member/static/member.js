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

    var button = $(".btn_expand");

    button.attr("expand", "no");// 初始化为未展开

    button.click(function(){

        var $self = $(this);
        var expand = $self.attr("expand");
        var $cardShape = $self.parents(".card_shape");
        var $li = $cardShape.parent();
        var $bottomHalfExpand = $cardShape.children(".bottom_half_expand");
        var $bottomHalf = $cardShape.children(".bottom_half");

        if(expand === "no"){
            _doExpand();
        }else{
            _undoExpand();
        }

        _switch();

        function _doExpand(){
            $self.prop("src", "/resource/card_arrow_up.png");
            $bottomHalf.hide();
            $bottomHalfExpand.show();
            $li.height($li.height() - 50 + $bottomHalfExpand.height());
        }

        function _undoExpand(){
            $li.height($li.height() + 50 - $bottomHalfExpand.height());
            $bottomHalfExpand.hide();
            $bottomHalf.show();
            $self.prop("src", "/resource/card_arrow_down.png");
        }

        function _switch(){
            if(expand === "no"){
                $self.attr("expand", "yes");
            }else{
                $self.attr("expand", "no");
            }
        }
    });
}