$(function(){

    var data = {
        title: '标签 from art_template',
        list: ['文艺', '博客', '摄影', '电影', '民谣', '旅行', '吉他']
    };
    var content = template('test', data);

    $("#content").html(content);
});