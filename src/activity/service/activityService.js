/**
 * Created by yilos on 2015/1/15.
 */
var datas = new (require(FRAMEWORKPATH + "/bus/request"))();
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var uuid = require('node-uuid');
var async = require("async");

exports.countPageView = countPageView;
exports.countAppoint = countAppoint;
exports.show = show;

function countPageView(req, res, next){

    var value = req.body.source;
    var modify_date = new Date().getTime();
    var sql = "update planx_graph.wechat_storepageview_from set count = (count + 1), modify_date = :modify_date where path_from";

    if(value === "s"){
        sql += " = 'sms';";
    }else if(value === "q"){
        sql += " = 'qcode';";
    }else{
        sql += " = 'natural';";
    }

    dbHelper.execSql(sql, {modify_date: modify_date}, function (err, result) {

        if(err){
            console.log(err);
            next(err);
            return;
        }

        doResponse(req, res, result);
    });

}

function countAppoint(req, res, next){

    var call = req.body.call;
    var modify_date = new Date().getTime();
    var sql = "update planx_graph.wechat_storepageview_appoint set count = (count + 1), modify_date = :modify_date where shop_phone = :call;";

    dbHelper.execSql(sql, {modify_date: modify_date, call: call}, function(err, result){
        if(err){
            console.log(err);
            next(err);
            return;
        }

        doResponse(req, res, result);
    });

}

function show(req, res, next){

    var sqlPageView = "select * from planx_graph.wechat_storepageview_from;";
    var sqlAppoint = "select * from planx_graph.wechat_storepageview_appoint;";
    var model = {layout: false};

    dbHelper.execSql(sqlPageView, {}, function(err, result){

        if(err){
            console.log(err);
            next(err);
            return;
        }

        model.pageView = result;

        dbHelper.execSql(sqlAppoint, {}, function(err, result){

            if(err){
                console.log(err);
                next(err);
                return;
            }

            model.appoint = result;
            res.render("show", model);
        });

    });
}