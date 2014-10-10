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

    $("#present_form").submit(function($event){

        $event.preventDefault();

        var phone = $("#input_phone").val();

        if (!phone) {
            alert("请输入手机号");
            return;
        }

        if(!_checkPhone()){
            alert("手机号有误，请重新输入");
            return;
        }

        var enterprise_id = $("#enterprise_id").text();
        var festival_id = $("#festival_id").text();

        var url = "/svc/wsite/" + enterprise_id + "/getPresent?fid=" + festival_id;

        $.post(url, {phone: phone}, function (response) {

            var code = response.code;

            if(code !== 0){
                alert("领取失败，请联系客服");
                return;
            }

            var status = response.result.status;

            if(status === 1){
                location.href = "done";
            }else{

                var windowHeight = $(window).height();
                var contentHeight = $("#content").height();
                var max = Math.max(windowHeight, contentHeight);
                
                $("#repeat-deny").height(max).show();
            }
        });

        function _checkPhone(){
            return (/^13\d{9}$/g.test(phone)||(/^15\d{9}$/g.test(phone))||(/^18\d{9}$/g.test(phone)));
        }
    });

    $("#back").on("click", function ($even) {
        location.href = "festival";
        $even.stopPropagation();
    });

    $("#repeat-deny").tap(function(){
        $(this).hide();
    });

    // 如果是在微信中打开
    WeixinApi.ready(function(Api) {

        attachShareCallback();

        function attachShareCallback(){

            var enterpriseId = $("#enterprise_id").text();
            var festivalId = $("#festival_id").text();
            var slogan = $("#slogan").text();

            var wxData = {
                "imgUrl": global["_g_server"].staticurl + "/resource/share_thumb.png",//"http://121.40.75.73/resource/share_thumb.png",
                "link": global["_g_server"].serviceurl + "/wsite/" + enterpriseId + "/route?fid=" + festivalId,//"http://121.40.75.73/svc/wsite/" + enterpriseId + "/route?fid=" + festivalId,
                "desc": slogan,
                "title": ""
            };

            var wxCallbacks = {

                confirm: function(resp) {
                    var shareCountURL = "/svc/wsite/" + enterpriseId + "/countShare?fid=" + festivalId;
                    $.post(shareCountURL, {}, function(response){});
                }
            };

            Api.shareToTimeline(wxData, wxCallbacks);
        }
    });
}