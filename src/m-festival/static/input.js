$(function(){

    $("#btn_submit").tap(function(){

        var phone = $("#input_phone").val();

        if (!phone) {
            alert("请输入手机号");
            return;
        }

        var enterprise_id = $("#enterprise_id").text();
        var festival_id = YLS.getQueryString("fid");

        var url = "/svc/wsite/" + enterprise_id + "/getPresent?fid=" + festival_id;

        $.post(url, {phone: phone}, function (response) {

            var status = response.result.status;
            if(status === 1){
                location.href = "done?duplicate=false";
            }else{
                location.href = "done?duplicate=true";
            }
        });
    });
});