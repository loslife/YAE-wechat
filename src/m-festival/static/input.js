$(function(){

    $("#btn_submit").tap(function(){

        var phone = $("#input_phone").val();

        if (!phone) {
            alert("请输入手机号");
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
                location.href = "done?duplicate=false";
            }else{
                location.href = "done?duplicate=true";
            }
        });
    });

    $("#back").on("click", function ($even) {
        location.href = "festival";
        $even.stopPropagation();
    });

});