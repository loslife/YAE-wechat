$(function(){

    $("#btn_submit").on("click", function(event){

        var enterprise_id = $("#enterprise_id").text();
        var phone = $("#input_phone").val();

        var url = "/svc/wsite/" + enterprise_id + "/login";

        $.post(url, {phone: phone}, function(response){

            if(response.code !== 0){
                alert("登陆失败");
            }else{
                window.location = "member";
            }
        })
    });
});


