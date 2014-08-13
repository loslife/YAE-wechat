/**
 * 覆盖express的视图查找逻辑，使其支持多个视图文件
 * 用以支持每个应用可以指定自己的express视图目录
 * @type {{enableMultipleViewFolders: Function}}
 */

module.exports = {
    enableMultipleViewFolders:enableMultipleViewFolders
}

function enableMultipleViewFolders(app) {
    var lookupProxy = app.view.prototype.lookup;
    // proxy function to the default view lookup
    app.view.prototype.lookup = function (path) {
        if (this.root instanceof Array) {
            // loops through the paths and tries to match the view
            var matchedView = null,
                roots = this.root;
            for (var i=0; i<roots.length; i++) {
                this.root = roots[i];
                matchedView = lookupProxy.call(this, path);
                if (matchedView) break;
            }
            this.root = roots;
            return matchedView;
        }

        return lookupProxy.call(this, path)
    };
}




