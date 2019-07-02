# 实时视频会议小程序SDK

> 使用此组件需要依赖小程序基础库 2.2.1 以上版本，同时依赖开发者工具的 npm 构建。具体详情可查阅[官方 npm 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)。

# 准备工作

1. 注册微信小程序，登录小程序后台获取微信小程序appid，appSecrert，修改类目审核（社交、教育、医疗、政务民生、金融，目前只有这些支持），配置socket合法域名wss://teameeting.anyrtc.io:9095
2. 前往平台注册账号获取开发者信息，创建应用并开通小程序服务
3. 开发-配置中开启“使用npm模块”，基础库选择2.4.0及以上，打开“不校验合法域名”、真机调试打开“调试”。集成moniprogram-ar-meet、moniprogram-ar-push、moniprogram-ar-play

# 使用说明

> 1.结合[小程序会议SDK](https://www.npmjs.com/package/miniprogram-ar-meet)使用  
> 2.结合[小程序推流组件](https://www.npmjs.com/package/miniprogram-ar-push)和[小程序拉流组件](https://www.npmjs.com/package/miniprogram-ar-play)使用

# 配置

- 配置开发者信息、服务地址（私有云则输入私有云地址）`config.js`
- 配置小程序appid `project.config.json`

# 构建npm

打开微信开发者工具，点击‘工具’-‘构建npm’

# 项目配置

点击‘设置’-‘项目设置’，勾选'ES6转ES5', '使用npm模块'，'不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书'，查看‘域名信息’中的‘socket 合法域名’是否包含当前服务的域名，否则请前往微信小程序公众平台配置。

# 注意事项

使用真机允许并打开调试