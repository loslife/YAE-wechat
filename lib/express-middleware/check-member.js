module.exports = function(req, res, next){

    var paths = req.path.split("/");// ['', 'enterprise_id', 'shop']

    var enterprise_id = paths[1];
    var feature = paths[2];

    if(feature !== "member"){
        return next();
    }

    if(req.session && req.session.member_id){
        return next();
    }

    res.redirect("/svc/wsite/" + enterprise_id + "/login");
}