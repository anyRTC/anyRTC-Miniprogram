import ARCall from "miniprogram-ar-call";
import config from "../../../utils/config";
const types = ["视频面签", "视频开户", "客户咨询"];
const Businesses = ["face_sign", "account_open", "advisory"];
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    call: null,
    nickName: "",
    popItem: {
      isShow: false,
      isBgTap: false,
      type: "common"
    }
  },
  switchMode(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ type });
    this.data.call.makeCall("888881", 21, "{}", {
      Level: 3,
      Area: "shanghai",
      Business: Businesses[type]
    });

    wx.showLoading({ title: "正在接通客服..." });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // this.setData({nickName: options.name})
    this.initRTC();
    this.data.call.turnOn(options.name, "");
  },

  initRTC() {
    const call = new ARCall();
    this.setData({ call });
    call.initAppInfo(config.CALL_APP_ID, config.CALL_APP_TOKEN);
    call.configServer("ws.anyrtc.cc", 9095);
    app.globalData.call = call;

    wx.showLoading({ title: "载入中...", mask: true });
    call.on("online-success", () => {
      console.log("online-success");
      wx.hideLoading();
    });
    call.on("user-cti-status", waitings => {
      console.log("userCtiStatus", waitings);
      if (waitings > 1) {
        wx.hideLoading();
        this.setData({
          popItem: {
            isShow: true,
            title: types[this.data.type],
            waitings: parseInt(waitings) - 1
          }
        });
      } else {
        this.setData({ popItem: { isShow: false } });
        wx.showLoading({ title: "正在接通客服..." });
      }
    });
    call.on("get-wx-pushUrl", (code, data) => {
      console.log("get-wx-pushUrl", code, data);
      if (code == 0) {
        wx.hideLoading();
        Object.assign(app.globalData.call, data);
        wx.navigateTo({ url: `../p2p` });
      } else {
      }
    });
    call.on("join-failed", code => {
      console.log("join-failed", code);
    });

    call.on("accept-call", peerUserId => {
      console.log(peerUserId + "acceptcall");
      Object.assign(app.globalData.call, { peerUserId });
    });

    call.on("reject-call", (peerUserId, errCode) => {
      console.log("reject-call " + peerUserId + " " + errCode);
    });
  },
  closePop() {
    // this.data.call.endCall("888881");
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // this.initRTC();
    // this.data.call.turnOn(this.data.nickName, "");
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    this.data.call.turnOff();
    app.globalData.call = undefined;
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
