/**
 * Created by yilos on 2014/7/19.
 */
var OSS = require('oss-client')
    , fs = require('fs');
var oss = new OSS.OssClient({
    accessKeyId: 'vnpzyac7xuytlidnmmen2qjd',
    accessKeySecret: 'aSlozXeY7yg4SjljdLWSxLSxZqA='
});
var backup_bucket = "yilos-data-backup-history";
var public_bucket = "yilos";

module.exports = {
    putBackupObjectToOss: putBackupObjectToOss,
    putSignatureObjectToOss: putSignatureObjectToOss
}

function putBackupObjectToOss(fileName, filePath, callback) {
    putObjectToOss(backup_bucket, fileName, filePath, callback);
}

function putSignatureObjectToOss(fileName, filePath, callback) {
    putObjectToOss(public_bucket, fileName, filePath, callback);
}

function putObjectToOss(bucket_name, fileName, filePath, callback) {
    if (!fs.existsSync(filePath)) {
        logger.error("上传文件到OSS失败，文件:" + filePath + "不存在");
        callback({errorMsg: "上传文件到OSS失败，文件:" + filePath + "不存在" });
        return;
    }
    oss.putObject({
        bucket: bucket_name,
        object: fileName,
        srcFile: filePath
    }, function (error) {
        if (error) {
            logger.error("上传文件到OSS失败,error:" + error);
        }
        callback(error);
    });
}