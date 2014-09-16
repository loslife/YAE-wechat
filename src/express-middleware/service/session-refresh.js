module.exports = function(req, res, next){
    var paths = req.path.split("/");
    var enterprise_id = paths[1];

    if(!req.session.enterprise_id){
        req.session.enterprise_id = enterprise_id;
        next();
        return;
    }

    if(req.session.enterprise_id === enterprise_id){
        next();
        return;
    }

    req.session.regenerate(function(err){
        req.session.enterprise_id = enterprise_id;
        next();
    });
};
