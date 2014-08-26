$(function(){

    $("#getSecurityCode").tap(function(){

        var phone = "15019432710";

        var url = "http://192.168.1.124:3000/svc/getCode/" + phone + "?u=weixin_binding";

        $.get(url, function(response){
            alert("ok");
        })
    });

});