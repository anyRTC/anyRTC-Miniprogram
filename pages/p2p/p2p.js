import ARCall from "miniprogram-ar-call";
import config from "../../utils/config";
const app = getApp();
const Businesses = ["face_sign", "account_open", "advisory"];
Page({
  data: {
    type: 0,
    call: null,
    peerUserId: "",
    members: [],
    pubID: "",
    pushURL: "",
    enableVideo: true,
    enableAudio: true,
    messageList: []
  },

  sendMessage() {
    this.data.call.sendUserMessage(
      JSON.stringify({ NickName: "NickName", Content: "Content" })
    );

    const messageList = this.data.messageList;
    messageList.push({ userName: "NickName", message: "Content" });
    this.setData({ messageList });
  },

  switchCamera() {
    this.data.arPushcomponent.switchCamera();
  },

  takeSnapshot() {
    this.data.arPushcomponent.snapshot(res => {
      wx.showToast({
        title: "保存成功"
      });
      console.log(res);
      wx.saveImageToPhotosAlbum({
        filePath: res.tempImagePath
      })
    });
  },

  switchAudio() {
    this.setData({
      enableAudio: !this.data.enableAudio
    });
  },

  switchVideo() {
    this.setData({
      enableVideo: !this.data.enableVideo
    });
  },

  leaveRoom() {
    wx.showModal({
      title: "提示",
      content: "确认退出会议？",
      success: res => {
        if (res.confirm) {
          this.onUnload();
          wx.navigateBack({
            delta: 1
          });
        } else if (res.cancel) {
        }
      }
    });
  },
  onLoad: function(options) {
    const call = app.globalData.call;
    this.setData({
      pubID: call.pubID,
      pushURL: call.pushURL,
      peerUserId: call.peerUserId,
      call,
      arPushcomponent: this.selectComponent("#arPush")
    });
    // this.initRTC();
    // this.data.call.turnOn(app.globalData.nickName, "");
    this.initCall();
  },
  initCall() {
    const call = this.data.call;
    call.on("user-message", (userId, msgContent) => {
      console.log("user-message", userId, msgContent);
      const body = JSON.parse(msgContent);

      const messageList = this.data.messageList;
      messageList.push({ userName: body.NickName, message: body.Content });
      this.setData({ messageList });
    });
    call.on("end-call", (peerUserId, errCode) => {
      console.log("end-call " + peerUserId + " " + errCode);
      this.data.arPushcomponent.stop();
    });
  },
  initRTC() {
    const call = new ARCall();
    this.setData({ call });
    call.initAppInfo(config.CALL_APP_ID, config.CALL_APP_TOKEN);
    call.configServer("ws.anyrtc.cc", 9095);

    call.on("online-success", () => {
      console.log("online-success");
      call.makeCall("888881", 21, "{}", {
        Level: 3,
        Area: "shanghai",
        Business: Businesses[this.data.type]
      });
    });
    call.on("user-cti-status", queueNum => {
      console.log("userCtiStatus", queueNum);
    });
    call.on("get-wx-pushUrl", (code, data) => {
      console.log("get-wx-pushUrl", code, data);
      if (code == 0) {
        this.setData({
          pubID: data.pubID,
          pushURL: data.pushURL,
          arPushcomponent: this.selectComponent("#arPush")
        });
      } else {
      }
    });
    call.on("user-message", (userId, msgContent) => {
      console.log("user-message", userId, msgContent);
      const body = JSON.parse(msgContent);

      const messageList = this.data.messageList;
      messageList.push({ userName: body.NickName, message: body.Content });
      this.setData({ messageList });
    });
    call.on("stream-subscribed", (rtcPeerID, pubId, rtcUserData, render) => {
      console.log(
        `stream-subscribed ${rtcPeerID}, ${pubId}, ${rtcUserData}, ${render}`
      );
      // render.id = 'video_' + rtcPeerID;
      // document.body.appendChild(render);
    });

    call.on("stream-unsubscribed", (rtcPeerID, pubId, rtcUserData) => {
      console.log(`stream-unsubscribed ${rtcPeerID}, ${pubId}, ${rtcUserData}`);
      // document.getElementById('video_' + rtcPeerID).remove();
    });

    call.on("join-failed", code => {
      console.log("join-failed", code);
    });

    call.on("accept-call", peerUserId => {
      console.log(peerUserId + "acceptcall");
      this.setData({
        peerUserId: peerUserId
      });
    });

    call.on("reject-call", (peerUserId, errCode) => {
      console.log("reject-call " + peerUserId + " " + errCode);
    });

    call.on("end-call", (peerUserId, errCode) => {
      console.log("end-call " + peerUserId + " " + errCode);
      this.data.arPushcomponent.stop();
    });
  },

  handlePushStatus(e) {
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

  handlePushNetChange(e) {
    let data = e.detail;

    // console.log('handlePushNetChange ====> 音频码率: %d , 视频码率: %d , 网络偏移: %d , 帧率：%d , 视频分辨率： %d * %d , GOP： %d', data.audioBitrate, data.videoBitrate, data.netJitter ? data.netJitter : 0, data.videoFPS, data.videoWidth, data.videoHeight, data.videoGOP);
  },

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
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    this.onScreen(true);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    let call = this.data.call;
    // call.turnOff();
    if (this.data.peerUserId) {
      call.endCall(this.data.peerUserId);
      this.data.arPushcomponent.stop();
    }
    this.onScreen(false);
  },
  onScreen(always = true) {
    wx.setKeepScreenOn({
      keepScreenOn: always
    });
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {}
});
