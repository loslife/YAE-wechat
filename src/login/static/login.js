$(function(){

    $("#btn_submit").on("click", function(event){

        var enterprise_id = $("#enterprise_id").text();
        var phone = $("#input_phone").val();

        var url = "/svc/wsite/" + enterprise_id + "/login";

        $.post(url, {phone: phone}, function(response){

            alert(response);
        })
    });

});


