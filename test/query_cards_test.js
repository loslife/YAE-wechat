global["_g_topo"] = {
    env: "dev",
    dataServer: {
        mongodb: {
            ip: "127.0.0.1"
        },
        mysql: {
            "ip": "yilosdev.mysql.rds.aliyuncs.com",
            "port": 3306,
            "user": "yilos_dev",
            "password": "yilos_dev"
        }
    }
}

global.FRAMEWORKPATH = "/users/apple/git_local/YAE-SERVER/lib";

var target = require("../src/interface/service/memberService");

var condition = {
    wx_open_id: "dddd",
    enterprise_id: "100027902021700200"
};

target.queryCardsByCondition(condition, function(err, messages){

    if(err){
        console.log(err);
        return;
    }

    console.log(messages);
});