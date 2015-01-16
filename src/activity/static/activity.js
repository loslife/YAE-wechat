$(function () {
    var url = window.location.search;
    if(url) {
        var p = url.indexOf("=");
        var value = url.substr(p + 1);
        $.post("/svc/activity/pageView", {source: value}, function (response) {

        });
    }else{
        var value = "natural";
        $.post("/svc/activity/pageView", {source: value}, function (response) {

        });
    }

    var $div = $(".phone img");

    $div.click(function(e){

        var call = $(this).attr("data-phone");
        $.post("/svc/activity/calls", {call: call}, function(response){

        });
    });

});





