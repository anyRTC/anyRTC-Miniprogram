// pages/rtmpc/rtmpc.js
import { XcxGuestKit } from "miniprogram-ar-rtmpc";
import config from "../../utils/config";

Page({
  /**
   * 页面的初始数据
   */
  data: {
    onLine: false,

    liveInfo: null,
    roomId: "",
    userID: "",
    pubID: "",
    pushURL: "", //推流地址

    playURL: "", //拉流地址
    pullUrl: "",

    enableAudio: true,
    enableVideo: true,
    debug: false,
    beauty: 0,
    members: [],
    messageList: []
  },

  applyConnect() {
    wx.showToast({
      title: "已发送申请"
    });
    this.data.wxrtmpc.applyRTCLine(JSON.stringify({ nickName: "hello" }));
  },

  sendMessage() {
    this.data.wxrtmpc.doSendMessage(
      JSON.stringify({ message: "doSendMessage" })
    );
  },

  switchDebug() {
    this.setData({
      debug: !this.data.debug
    });
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

  switchCamera() {
    this.data.arPushcomponent.switchCamera();
  },

  handlePlayNetChange() {},

  handlePlayStatus() {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let liveInfo = JSON.parse(options.liveInfo);
    wx.setNavigationBarTitle({ title: `房间ID:${liveInfo.liveTopic}` });

    this.setData({
      wxrtmpc: new XcxGuestKit(),
      userID: "" + parseInt(Math.random() * Math.pow(10, 6)),
      roomId: liveInfo.anyrtcId,
      playURL: liveInfo.rtmpUrl,
      pullUrl: liveInfo.rtmpUrl,
      liveInfo
    });

    this.init();
  },

  init() {
    let that = this;

    that.data.wxrtmpc.configServer("operation.anyrtc.cc");

    that.data.wxrtmpc.initEngine(
      config.RTMPC_DEV_ID,
      config.RTMPC_APP_ID,
      config.RTMPC_APP_KEY,
      config.RTMPC_APP_TOKEN,
      config.RTMPC_APP_DOMAIN
    );

    that.data.wxrtmpc.joinRTCLine(
      that.data.roomId,
      that.data.userID,
      JSON.stringify({
        devType: 0,
        headUrl: "",
        nickName: "",
        userid: that.data.userID
      })
    );

    //连接RTC结果回调
    that.data.wxrtmpc.on("onJoinLineResult", (code, data) => {
      console.log("onJoinLineResult", code, data);
      if (code == 0) {
        wx.showToast({
          icon: "success",
          title: "加入房间成功"
        });
      } else if (code == 605) {
        wx.showToast({
          icon: "none",
          title: "直播未开始"
        });
      } else {
        wx.showToast({
          icon: "none",
          title: "加入房间失败： " + code
        });
      }
    });

    //远程人员加入
    that.data.wxrtmpc.on(
      "onRemoteJoin",
      (strPeerId, xcxUserId, userId, userData) => {
        console.log("onRemoteJoin", strPeerId, xcxUserId, userId, userData);
        if (strPeerId === "RTMPC_Line_Hoster") {
          console.log("RTMPC_Line_Hoster==>", xcxUserId, userId, userData);
          // that.setData({
          //   hosterXcxUserId: xcxUserId
          // });
        }

        // let userDataStack = that.data.xcxUserData;

        // userDataStack.push({
        //   xcxUserId,
        //   peerId: strPeerId,
        //   userId,
        //   userData
        // });

        // that.setData({
        //   xcxUserData: userDataStack
        // });
      }
    );

    //申请连线结果
    that.data.wxrtmpc.on("onApplyLineResult", (code, id) => {
      console.log("onApplyLineResult", code, id);
      if (code === 0) {
        that.setData({
          onLine: true
        });
      } else if (code === 601) {
        //拒绝连线
        wx.showToast({
          title: "主播拒绝连线",
          icon: "none"
        });
      } else {
        //
      }
    });

    //连线被挂断
    that.data.wxrtmpc.on("onHangupLine", () => {
      console.log("onHangupLine");

      that.setData(
        {
          onLine: false,
          playURL: that.data.pullUrl,
          pushURL: "",
          members: []
        },
        () => {
          that.data.arPushcomponent.stop();
        }
      );
    });

    //获取直播推流地址
    that.data.wxrtmpc.on("onGetPushUrl", (code, data) => {
      console.log("onGetPushUrl", code, data);
      if (code === 0) {
        //成功
        that.setData({
          xcxUserId: data.xcxUserId,
          pushURL: data.pushURL,
          arPushcomponent: that.selectComponent("#arPush")
        });
        if (that.data.isHoster) {
          //主播
          that.setData({
            onLine: true
          });
        }
      } else {
        wx.showToast({
          icon: "none",
          title: "获取房间签名失败"
        });
      }
    });
    //直播人员列表
    that.data.wxrtmpc.on("onMemberListNotify", (nTotal, RoomID, RoomSvrID) => {
      console.log("onMemberListNotify", nTotal, RoomID, RoomSvrID);
    });
    //直播开始
    that.data.wxrtmpc.on("onLiveStart", () => {
      console.log("onLiveStart");
    });
    //消息回调
    that.data.wxrtmpc.on(
      "onUserMessage",
      (nType, strUserId, strUserName, strUserHeaderUrl, strMessage) => {
        console.log(
          "onUserMessage",
          nType,
          strUserId,
          strUserName,
          strUserHeaderUrl,
          strMessage
        );
        const messageList = that.data.messageList;
        messageList.push({ userName: strUserName, message: strMessage });
        that.setData({ messageList });
      }
    );
    //直播暂时停止
    that.data.wxrtmpc.on("onLiveStop", () => {
      console.log("onLiveStop");
      that.backIndex();
    });
    //直播结束
    that.data.wxrtmpc.on("onLineLeave", () => {
      console.log("onLineLeave");
      wx.showToast({
        icon: "success",
        title: "直播已结束"
      });
      wx.redirectTo({
        url: "/pages/index/index"
      });
    });
  },

  handlePushStatus() {},

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
    }
  },

  handlePushNetChange() {},

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
  onHide: function() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {},

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
