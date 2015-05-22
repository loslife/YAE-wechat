var api = require("wechat-toolkit");

var menu = {

    "button":[
        {
            "name": "认识乐斯",
            "sub_button":[
                {
                    "type": "click",
                    "name": "乐斯用户",
                    "key": "LS_USER"
                },
                {
                    "type": "click",
                    "name": "乐斯产品",
                    "key": "LS_PRODUCTION"
                },
                {
                    "type": "click",
                    "name": "乐斯简介",
                    "key": "LS_INTRO"
                }
            ]
        },
        {
            "name": "美业管家",
            "sub_button":[
                {
                    "type": "click",
                    "name": "人工服务",
                    "key": "HUMAN_SERVICE"
                },
                {
                    "type": "view",
                    "name": "使用指南",
                    "url": "http://wx.yilos.com/meiguanjia/operatingGuide.html"
                },
                //{
                //    "type": "view",
                //    "name": "常见问题",
                //    "url": ""
                //},
                {
                    "type": "click",
                    "name": "下载试用",
                    "key": "APP_DOWNLOAD"
                }
            ]
        },
        {
            type: "view",
            name: "购买服务",
            url: "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxd37396c2dc23ba21&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fmeiyeguanjia%2Fsignin&response_type=code&scope=snsapi_base&state=los_wsite#wechat_redirect"
        }
    ]
};

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