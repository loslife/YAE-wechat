$(function(){

    $(".festival-item").click(function(){
        var fid = $(this).children("span").text();
        location.href = "./festival/route?fid=" + fid;
    });
});

