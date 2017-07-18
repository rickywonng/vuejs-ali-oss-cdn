/**
 * Created by Rice on 7/14/2017.
 */
var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var oss = require('ali-oss').Wrapper;

function OssWebpackPlugin(options){
    this._config = _.cloneDeep(options);
}
OssWebpackPlugin.prototype.apply = function (compiler){
    var config = this._config;
    // 替换index.html中的资源路径为CDN路径
    compiler.plugin('compilation', function (compilation) {
        compilation.plugin('html-webpack-plugin-before-html-processing', function (data, cb){
            _.forEach(['css', 'js'], function (resType){
                _.forEach(data.assets[resType], function (value, index, arr){
                    arr[index] = config.cdn.cdn_host + value;
                });
            });
            return cb();
        });
    });
    // 自动上传编译后的资源至oss中
    compiler.plugin('after-emit', function (compilation, cb){
        var ossStore = oss({
            "accessKeyId": config.oss.access_key_id,
            "accessKeySecret": config.oss.access_key_secret,
            "bucket": config.oss.bucket,
            "endpoint": config.oss.end_point
        });
        var logPrefix = 'upload to bucket ['+config.oss.bucket+']';
        var promises = [];
        _.map(compilation.assets, function (assetInfo, assetPath){
            var promise = new Promise(function (resolve, reject){
                return ossStore.head(assetPath)
                    .then(function (result){
                        var content = fs.readFileSync(assetInfo.existsAt);
                        var fileHash = crypto.createHash('md5').update(content).digest('hex').toUpperCase();
                        if (fileHash != result.res.headers.etag.substr(1, 32)){
                            resolve(null);
                        }
                        else{
                            console.log(logPrefix+'[skipped]: '+assetPath+', not modified');
                            resolve(result);
                        }
                    })
                    .catch(function (err){
                        resolve(null);
                    });
            })
                .then(function (fileInfo){
                    if (fileInfo == null){
                        var promise = ossStore.put(assetPath, assetInfo.existsAt, {
                            "headers": {
                                "Expires": 30*24*60*60*1000+"",
                            }
                        });
                        return promise
                            .then(function (result){
                                console.log(logPrefix+'[success]: '+assetPath);
                            })
                            .catch(function (err){
                                console.log(logPrefix+'[failed]: '+assetPath);
                            });
                    }
                    return null;
                });
            promises.push(promise);
        });
        Promise.all(promises)
            .catch(function (err){
                var a = 0;
            })
            .finally(cb)
    });

}
module.exports = OssWebpackPlugin;
