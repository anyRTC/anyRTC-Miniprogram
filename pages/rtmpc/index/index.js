// pages/meet/index/index.js
const config = require('../../../utils/config.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    rtmpcList: []
  },
  rtmpcClick(e) {
    const row = e.currentTarget.dataset.row;
    wx.navigateTo({ url: `/pages/rtmpc/rtmpc?liveInfo=${JSON.stringify(row)}`})
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;

  },

  getRoomList() {
    let that = this;

    wx.request({
      url: "https://" + config.arServercUrl + 'livelist_no_auth?AppID=' + config.APP_ID + '&DeveloperID=' + config.DEV_ID,
      success(res) {
        let data = res.data;
        if (data.code) {
          throw new Error('获取直播list错误');
          return;
        }
        let liveList = [];
        if (data.ArraySize > 0) {
          let roomList = data.LiveList;
          let roomMembers = data.LiveMembers;

          roomList.map((item, index) => {
            let roomInfo = JSON.parse(item);
            roomInfo.members = roomMembers[index];
            liveList.push(roomInfo);
          });
        }
        that.setData({
          rtmpcList: liveList
        });
      },
      fail(err) {
        throw new Error('获取直播list错误');
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getRoomList();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    let that = this;

    that.getRoomList();
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})