$(function(){

    $("#btn_submit").tap(function(){

        var phone = $("#input_phone").val();

        if (!phone) {
            alert("请输入手机号");
            return;
        }

        var enterprise_id = $("#enterprise_id").text();
        var festival_id = YLS.getQueryString("fid");

        var url = "/svc/wsite/" + enterprise_id + "/walkinGetPresent?fid=" + festival_id;

        $.post(url, {phone: phone}, function (response) {

            if (response.code !== 0) {
                alert("领取失败，请联系客服");
            } else {
                location.href = "share?fid=" + festival_id;
            }
        });
    });
});