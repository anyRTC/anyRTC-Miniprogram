const _windowWidth = wx.getSystemInfoSync().windowWidth;
import config from "../../utils/config";
import wxRTMeet from "miniprogram-ar-meet";

Page({
  data: {
    arPusherComponent: null,
    wxmeet: null,
    roomId: "",
    debug: false,
    beauty: 0,
    enableVideo: true,
    enableAudio: true,
    pubID: "",
    pushURL: "",
    pushWidth: _windowWidth,
    members: []
  },

  switchCamera() {
    this.data.arPusherComponent.switchCamera();
  },

  switchBeauty() {
    this.setData({
      beauty: this.data.beauty == 0 ? 5 : 0
    });
  },

  switchAudio() {
    this.setData({
      enableAudio: !this.data.enableAudio
    });
  },

  switchDebug() {
    this.setData({
      debug: !this.data.debug
    });
  },

  leaveRoom() {
    let that = this;
    wx.showModal({
      title: "提示",
      content: "确认退出会议？",
      success(res) {
        if (res.confirm) {
          that.data.wxmeet.leaveRoom();
          // wx.redirectTo({
          //   url: "/pages/meet/index/index"
          // });
          wx.navigateBack({
            fail() {
              wx.reLaunch({
                url: "/pages/meet/index/index"
              });
            }
          });
        } else if (res.cancel) {
        }
      }
    });
  },

  onScreen() {
    wx.setKeepScreenOn({
      keepScreenOn: true
    });
  },

  offScreen() {
    wx.setKeepScreenOn({
      keepScreenOn: false
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.setNavigationBarTitle({ title: `房间ID:${options.roomId}` });
    let that = this;
    let roomId = "" + options.roomId;
    let wxmeet = new wxRTMeet();

    that.onScreen();

    that.setData({
      roomId: roomId,
      wxmeet: wxmeet,
      arPusherComponent: that.selectComponent("#arPush")
    });

    wxmeet.configServer(config.arServercUrl, config.arServerPort);
    //初始化
    wxmeet.setUserToken("");
    wxmeet.initAppInfo(config.MEET_APP_ID, config.MEET_APP_TOKEN);

    let userid = "" + parseInt(Math.random() * 10000);
    let username = "" + parseInt(Math.random() * 1000000);
    //加入房间
    wxmeet.joinRoom(
      roomId,
      userid,
      username,
      JSON.stringify({ callPoliceId: 2 }),
      that.data.enableVideo,
      that.data.enableAudio
    );
    //加入房间成功回调
    wxmeet.on("onJoinRoomOK", () => {
      // console.log("加入房间成功");
      wx.showLoading({
        title: "获取推流地址...",
        mask: true
      });
      wxmeet.sendUserMessage("haha", "avatar", "{type:1}" + Date.now());
    });
    //加入房间失败回调
    wxmeet.on("onJoinRoomFaild", (code, info) => {
      console.log("onJoinRoomFaild", code, info);
      wx.showToast({
        icon: "none",
        title: "加入房间失败",
        complete: function() {
          wx.reLaunch({
            url: "/pages/index/index"
          });
        }
      });
    });
    //收到离开房间指令,收到该回调需要离开房间
    wxmeet.on("onLeaveMeet", (code, info) => {
      console.log("离开房间的原因：", info ? info : "");
      wxmeet.leaveRoom();
    });
    //收到推流URL回调，将URL绑定到ar-push组件中，其他人将收到自己的视频
    wxmeet.on("onGetPushUrl", (code, data) => {
      wx.hideLoading();
      console.log("onGetPushUrl", code, data);
      if (code === 0) {
        //成功
        that.setData({
          pushURL: data.pushURL
        });
      } else {
        wx.showToast({
          icon: "none",
          title: "获取房间签名失败"
        });
      }
    });

    wxmeet.on("onUserMessage", (UserName, NickName, HeaderUrl, Content) => {
      console.log("------", UserName, NickName, HeaderUrl, Content);
    });
  },

  //监听房间事件
  handleRoomEvent(e) {
    let that = this;
    let data = e.detail;

    console.log("handleRoomEvent", data);
    let members = that.data.members;

    switch (data.tag) {
      case "MemberJoin":
        let newMember = data.detail;

        newMember.map(item => {
          members.push(item);
        });

        that.setData({
          members: members
        });
        break;
      case "MemberLeave":
        let leaveUsers = data.detail;

        members.map((item, index) => {
          leaveUsers.map((i, n) => {
            if (i.pubID === item.pubID) {
              members.splice(index, 1);
            }
          });
        });

        that.setData({
          members: members
        });
        break;
      case "PushError":
        //重新进会
        break;
    }
  },

  //监听推流状态
  handlePushStatus(e) {
    let that = this;
    let data = e.detail;
    let code = data.code;

    console.log("handlePushStatus", data);

    switch (code) {
      case 1002: {
        console.log("推流成功");
        break;
      }
      case -1301: {
        console.error("打开摄像头失败: ", code);
        break;
      }
      case -1302: {
        console.error("打开麦克风失败: ", code);
        break;
      }
      case -1307: {
        console.error("推流连接断开: ", code);
        break;
      }
      case 5000: {
        console.log("收到5000: ", code);
        // 收到5000就退房
        break;
      }
      case 1018: {
        console.log("进房成功", code);
        break;
      }
      case 1019: {
        console.log("退出房间", code);
        break;
      }
      case 1021: {
        console.log("网络类型发生变化，需要重新进房", code);
        //先退出房间
        break;
      }
      case 2007: {
        console.log("视频播放loading: ");
        break;
      }
      case 2004: {
        console.log("视频播放开始: ");
        break;
      }
      case 10001: {
        console.log("未获取到摄像头功能权限，请删除小程序后重新打开");
        break;
      }
      case 10002: {
        console.log("未获取到录音功能权限，请删除小程序后重新打开");
        break;
      }
      default: {
        console.log("推流情况：", code);
      }
    }
  },

  //监听推流网络质量
  handlePushNetChange(e) {
    let that = this;
    let data = e.detail;

    console.log("handlePushNetChange", data);
    console.log(
      "handlePushNetChange ====> 音频码率: %d , 视频码率: %d , 网络偏移: %d , 帧率：%d , 视频分辨率： %d * %d , GOP： %d",
      data.audioBitrate,
      data.videoBitrate,
      data.netJitter ? data.netJitter : 0,
      data.videoFPS,
      data.videoWidth,
      data.videoHeight,
      data.videoGOP
    );
  },

  //监听拉流网络质量
  handlePlayNetChange(e) {
    let that = this;
    let data = e.detail;

    console.log(
      "handlePlayNetChange 用户PubId：",
      e.currentTarget.id.replace("user_", "").replace("-play", ""),
      " , 用户网络状态: ",
      data
    );
  },

  //监听播放状态
  handlePlayStatus(e) {
    let that = this;
    let data = e.detail;

    //错误码参考 https://developers.weixin.qq.com/miniprogram/dev/component/live-player.html
    console.log(
      "handlePlayStatus",
      `pubID为 ${data.pubID} 的播放状态为 ${data.code}`
    );
  },

  pause(e) {
    let that = this;
    let data = e.currentTarget.dataset;

    //参考 https://developers.weixin.qq.com/miniprogram/dev/api/media/live/LivePlayerContext.pause.html
    that.selectComponent(`#${data.id}-play`).pause({
      complete: res => {
        console.log("selectComponent pause", res);
      }
    });
  },

  play(e) {
    let that = this;
    let data = e.currentTarget.dataset;

    //参考 https://developers.weixin.qq.com/miniprogram/dev/api/media/live/LivePlayerContext.play.html
    that.selectComponent(`#${data.id}-play`).play({
      complete: res => {
        console.log("selectComponent pause", res);
      }
    });
  },

  full(e) {
    let that = this;
    let data = e.currentTarget.dataset;

    //参考 https://developers.weixin.qq.com/miniprogram/dev/api/media/live/LivePlayerContext.requestFullScreen.html
    that.selectComponent(`#${data.id}-play`).requestFullScreen({
      direction: 90,
      complete: res => {
        console.log("selectComponent pause", res);
      }
    });
    //此处由于只做演示，所以2秒之后结束全屏
    setTimeout(() => {
      that.selectComponent(`#${data.id}-play`).exitFullScreen({
        complete: res => {
          console.log("selectComponent pause", res);
        }
      });
    }, 2000);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    //小程序后台，手机切到主页面
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onShareAppMessage: function(res) {
    // return custom share data when user share.
    return {
      title: "快来参加我们的视频会议吧~",
      path: "/pages/meet/meet?roomId=" + this.data.roomId
    };
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    console.log("onUnload");
    //返回入口，关闭小程序
    this.data.wxmeet.leaveRoom();
    this.offScreen();
  }
});
