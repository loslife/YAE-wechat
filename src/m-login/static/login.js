function onBridgeReady(){
    WeixinJSBridge.call('hideOptionMenu');
}

if (typeof WeixinJSBridge == "undefined"){
    if(document.addEventListener){
        document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
    }else if (document.attachEvent){
        document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
        document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
    }
}else{
    onBridgeReady();
}

$(function(){

    $("#btn_submit").on("tap", function(e){

        var enterprise_id = $("#enterprise_id").text();
        var phone = $("#input_phone").val();

        var url = "/svc/wsite/" + enterprise_id + "/login";

        $.post(url, {phone: phone}, function(response){

            if(response.code !== 0){
                alert("登陆失败");
            }else{
                window.location = "member";
            }
        });
    });
});


