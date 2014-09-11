$(function(){

    $("#btn_submit").tap(function(){

        var phone = $("#input_phone").val();

        if (!phone) {
            alert("请输入手机号");
            return;
        }

        var enterprise_id = $("#enterprise_id").text();
        var url = "/svc/wsite/" + enterprise_id + "/walkinGetPresent";

        $.post(url, {phone: phone}, function (response) {

            if (response.code !== 0) {
                alert("失败啦");
            } else {
                alert(response);
            }
        });
    });
});