$(function(){

    $("#back").on("click", function ($even) {
        location.href = "festival";
        $even.stopPropagation();
    });

});
