var api = require("wechat-toolkit");

exports.create = create;

var menu = {

    "button":[
        {
            "name": "认识乐斯",
            "sub_button":[
                {
                    "type": "CLICK",
                    "name": "乐斯用户",
                    "key": "LS_USER"
                },
                {
                    "type": "CLICK",
                    "name": "乐斯产品",
                    "key": "LS_PRODUCTION"
                },
                {
                    "type": "CLICK",
                    "name": "乐斯简介",
                    "key": "LS_INTRO"
                }
            ]
        },
        {
            "name": "玩转乐斯",
            "sub_button":[
                {
                    "type": "CLICK",
                    "name": "人工服务",
                    "key": "HUMAN_SERVICE"
                },
                {
                    "type": "CLICK",
                    "name": "新手上路",
                    "key": "USER_GUIDE"
                },
                {
                    "type": "CLICK",
                    "name": "App下载",
                    "key": "APP_DOWNLOAD"
                }
            ]
        },
        {
            "type": "VIEW",
            "name": "购买服务",
            "url": "http://mp.weixin.qq.com/bizmall/mallshelf?id=&t=mall/list&biz=MzA3NDk0NjUxNg==&shelf_id=1&showwxpaytitle=1#wechat_redirect"
        }
    ]
};

function create(){
    api.getAccessToken("wxd37396c2dc23ba21", "9600186549bc52bdf0d2d7390b05fd2c", function(err, access_token){

        if(err){
            console.log(err);
            return;
        }

        api.createMenu(access_token, menu, function(err, error_code, error_message){

            if(err){
                console.log(err);
                return;
            }

            console.log(error_code);
            console.log(error_message);
        });
    });
}