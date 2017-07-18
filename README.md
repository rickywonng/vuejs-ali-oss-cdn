# vuejs-oss-cdn
vuejs 阿里云cdn 部署插件

在 config 目录下新建 oss-cdn.js
```ecmascript 6
module.exports = {
    'oss': {
        'access_key_id':  '{{ACCESS_KEY_ID}}',
        'access_key_secret': '{{ACCESS_KEY_SECRET}}',
        'end_point':  '{{OSS_END_POINT}}',
        'bucket': '{{BUCKET_NAME}}'
    },
    'cdn': {
        'enable': true, // 是否开启CDN
        'cdn_host': '//static.youwebsite.com' // CDN加速域名
    }
};
```
config\index.js 中引入配置
```ecmascript 6
module.exports = {
  build: {
    ...
    ossCdn: require('./oss-cdn')    
  },
  ...
}
```
build\webpack.prod.conf.js 中引入插件
```ecmascript 6
var webpackConfig = {
  plugins: [
    new CopyWebpackPlugin([
      ...
    ]),
    new OssWebpackPlugin(config.build.ossCdn),
  ];

};
```
构建代码，大功告成
```
npm run build 
```






