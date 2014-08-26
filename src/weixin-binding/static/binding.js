$(function(){

    $("#getSecurityCode").tap(function(){

        var phone = "15019432710";

        var url = g_env.security_code_url + phone + "?u=weixin_binding";

        $.get(url, function(response){
            alert("ok");
        })
    });

});