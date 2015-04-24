$(function(){

    $(".festival-item").click(function(){
        var fid = $(this).children("span").text();
        var store_type = $("#store_type").text();
        location.href = "./festival/route?fid=" + fid + "&store_type=" + store_type;
    });
});

