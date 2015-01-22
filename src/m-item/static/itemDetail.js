$(function(){
    var $back = $("#back");
    var $itemDetail = $("#item-detail");

    $back.click(function($event){
        window.history.back();
        $event.stopPropagation();
    });

    $itemDetail.height($(window).height() - $back.height());

    $(".comment").height($itemDetail.height() - $(".img").height() - $(".name-price").height());
});



