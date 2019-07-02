import EventEmitter from './emitter.js';

class XcxGuestKit extends EventEmitter {
  constructor() {
    super();
    let that = this;

    this.url = 'www.anyrtc.io';
		this.urlSuffix = '/ws';
		this.svrUrl = 'wss://' + this.url + this.urlSuffix;

    this.webSocket = null;

    this.userToekn = '';
    this.useNewApi = false;//是否使用Token验证
    //所在房间
    this.anyrtcId = '';
    this.applyLine = false;
    //用户配置
    this.userId = '';
    this.userName = '';
    this.userData = '';
    //系统帐号配置
    this.devId = "";
    this.appId = "";
    this.appKey = "";
    this.appToken = "";
    //自己的ID，由后服务器创建
    this.my_id = "";
    this.seqn = 0;

    this.timer = null;
  }

  // 字节计算
  strlen(str) {
    var len = 0;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      //单字节加1
      if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
        len++;
      }
      else {
        len += 2;
      }
    }
    return len;
  }

  doInitWSocket() {
    let that = this;

    if (that.webSocket == null) {
      var strUrl = that.svrUrl + "/?Type=live_g_wx&UserId=" + that.devId + "&AppId=" + that.appId + "&AppKey=" + that.appKey + "&Token=" + that.appToken;

      that.webSocket = wx.connectSocket({
        url: strUrl,
        success: function (res) {
          that.Logcat('connectSocket success', res);
        },
        fail: function (error) {
          that.Logcat(error)
        }
      });

      that.webSocket.onOpen(function (data) {
        that.Logcat('onOpen', data);
      });

      that.webSocket.onMessage(function (evt) {
        var received_msg = evt.data;
        that.Logcat("RecvMsg: " + received_msg);

        var jsResp = JSON.parse(received_msg);
        if (jsResp.Cmd != undefined) {
          if (jsResp.Code == 200) {
            that.my_id = jsResp.DyncID;

            var objMsg = {};
            objMsg["Cmd"] = "Join";
            objMsg["AnyrtcId"] = that.anyrtcId;
            objMsg["UserId"] = that.userId;
            objMsg["UserName"] = that.userName;
            objMsg["UserData"] = that.userData;
            objMsg["XcxLine"] = true;
            that.Logcat(objMsg);
            that.doSendMessage(JSON.stringify(objMsg));

            that.doKeepyalive();
          }
        }
        else if (jsResp.Msgs != undefined) {
          var jsMsgs = jsResp.Msgs;
          for (var i = 0; i < jsMsgs.length; i++) {
            that.Logcat(jsMsgs[i]);
            var jMsg = JSON.parse(jsMsgs[i]);

            if (jMsg.Seqn <= that.seqn) {
              continue;
            }
            that.seqn = jMsg.Seqn;
            /** Liveing
             DC_JOIN_LIVE = 4001,
             DC_NOTIFY_LIVE,
             DC_LEAVE_LIVE,
             */
            if (jMsg.Cmd == 4001) {// DC_JOIN_LIVE
              if (jMsg.Params.Result == "ok") {
                var jsBody = JSON.parse(jMsg.Body);

                /**
                 *  RTC服务连接结果
                 *  @params nCode       0 成功
                 **/
                that.emit("onJoinLineResult", 0);
              }
              else {
                that.my_id = "";
                that.isAudioLive = false;
                that.webSocket = null;
                /**
                 *  RTC服务连接结果
                 *  @params nCode       605     RTCLive_IS_STOP
                 **/
                that.emit("onJoinLineResult", 605);
              }
            }
            else if (jMsg.Cmd == 4002) {// DC_NOTIFY_LIVE
              var jsBody = JSON.parse(jMsg.Body);
              if (jsBody.CMD == "AcceptApply") {//*Guest
                /**
                1, 取消拉流
                2，进入房间
                */

                /**
                 *  主播接收游客连麦
                 *  @params strLivePeerId       连麦者标识id（用于标识连麦用户，每次连麦随机生成）
                 **/
                that.emit("onApplyLineResult", 0, jsBody.LivePeerID);
              }
              else if (jsBody.CMD == "RejectApply") {//*Guest
                that.applyLine = false;
                /**
                 *  主播拒绝游客连麦
                 *
                 **/
                that.emit("onApplyLineResult", jsBody.Code ? jsBody.Code : 601);
              }
              else if (jsBody.CMD == "HangupLine") {//*Guest
                /**
                1, 离开房间
                2，继续拉流
                */

                that.applyLine = false;
                /**
                 *  主播挂断游客连麦
                 **/
                that.emit("onHangupLine");
              }
              else if (jsBody.CMD == "JoinXcx") {//
                var RoomID = jsBody.RoomID;
                var UserID = jsBody.UserID;
                var XcxAppID = jsBody.XcxAppID;
                var UserSig = jsBody.UserSig;

                that.getRoomSig(RoomID, UserID, XcxAppID, UserSig);
              }
              else if (jsBody.CMD == "Subscribe") {
                if (jsBody.Subscribe) {// && jsBody.RtcPeerID === "RTMPC_Line_Hoster"
                  // that.hosterXcxUserId = jsBody.XcxUserId;
                  that.emit("onRemoteJoin", jsBody.Hoster ? "RTMPC_Line_Hoster" : jsBody.RtcPeerID, jsBody.XcxUserId, jsBody.RtcCustomID, jsBody.RtcUserData);
                }
              }
              else if (jsBody.CMD == "UserMsg") {
                /**
                 *  收到消息回调
                 *  @params nType               消息类型    0 普通消息  1 弹幕消息
                 *  @params strUserId           游客在开发者平台的userid     jsBody.UserName
                 *  @params strUserName         游客在开发者平台的用户昵称
                 *  @params strUserHeaderUrl    游客在开发者平台的用户头像
                 *  @params strMessage          游客申请连麦时带过来的自定义参数体（可查看游客端申请连麦参数）
                 **/
                that.emit("onUserMessage", 0, jsBody.UserName, jsBody.NickName, (jsBody.HeaderUrl == undefined ? "" : jsBody.HeaderUrl), jsBody.Content);
              }
              else if (jsBody.CMD == "UserBarrage") {
                /**
                 *  收到消息回调
                 *  @params nType               消息类型    0 普通消息  1 弹幕消息
                 *  @params strUserId           游客在开发者平台的userid
                 *  @params strUserName         游客在开发者平台的userid
                 *  @params strUserHeaderUrl    游客在开发者平台的userid
                 *  @params strMessage          游客申请连麦时带过来的自定义参数体（可查看游客端申请连麦参数）
                 **/
                that.emit("onUserMessage", 1, jsBody.UserName, jsBody.NickName, (jsBody.HeaderUrl == undefined ? "" : jsBody.HeaderUrl), jsBody.Content);
              }
              else if (jsBody.CMD == "MemberNotify") {
                var nTotal = jsBody.Total,
                  RoomID = jsBody.RoomID,
                  RoomSvrID = jsBody.ServerID;
                /**
                 *  直播间实时在线人数变化通知
                 *  @params nTotalMember        当前活动在线实时人数
                 **/
                that.emit("onMemberListNotify", nTotal, RoomID, RoomSvrID);
              }
              else if (jsBody.CMD == "LiveStart") {//*Guest
                /**
                 *
                 **/
                that.emit("onLiveStart");    // 直播开始
              }
              else if (jsBody.CMD == "LiveStop") {//*Guest
                that.applyLine = false;
                /**
                 *
                 **/
                that.emit("onLiveStop"); // 主播暂时离开
              }
            }
            else if (jMsg.Cmd == 4003) {// DC_LEAVE_LIVE
              that.emit("onLineLeave");    // 主播关闭活动
            }
          }
        }
      });

      that.webSocket.onClose(function () {
        that.Logcat('webSocket onClose')
        that.webSocket = null;
      });
    }
  }

  doKeepyalive() {
    let that = this;

    if (that.my_id != "") {
      that.doSync();
      that.timer && clearTimeout(that.timer);
      that.timer = setTimeout(() => {
        that.doKeepyalive();
      }, 10000);
    }
  }

  doSync() {
    let that = this;

    var objMsg = {};
    objMsg["Cmd"] = "Sync";
    objMsg["ClintSeqn"] = that.seqn;
    that.doSendMessage(JSON.stringify(objMsg));
  }

  //发送指令
  doSendMessage(strMsg) {
    let that = this;

    if (that.webSocket != null) {
      that.webSocket.send({
        data: strMsg,
        complete: res => {
          that.Logcat(res);
        }
      });
    }
  }

  //断开链接
  doUnInitWSocket() {
    let that = this;

    if (that.webSocket != null) {
      that.webSocket.close();
      that.webSocket = null;
    }
  }

  getRoomSig(roomID, xcxUserId, sdkAppID, userSig) {
    let that = this;

    let url = 'https://official.opensso.tencent-cloud.com/v4/openim/jsonvideoapp';
    url += '?sdkappid=' + sdkAppID + "&identifier=" + xcxUserId + "&usersig=" + userSig + "&random=9999&contenttype=json";

    let reqHead = {
      "Cmd": 1,
      "SeqNo": 1,
      "BusType": 7,
      "GroupId": parseInt(roomID)
    };
    let reqBody = {
      "PrivMapEncrypt": "",
      "TerminalType": 1,
      "FromType": 3,
      "SdkVersion": 26280566
    };

    wx.request({
      url: url,
      data: {
        "ReqHead": reqHead,
        "ReqBody": reqBody
      },
      method: "POST",
      success: function (res) {
        that.Logcat("requestSigServer success:", res);

        let roomSig = JSON.stringify(res.data["RspBody"]);
        let pushUrl = "room://cloud.tencent.com?sdkappid=" + sdkAppID + "&roomid=" + roomID + "&userid=" + xcxUserId + "&roomsig=" + encodeURIComponent(roomSig);
        that.Logcat("roomSigInfo", roomID, xcxUserId, roomSig, pushUrl);

        that.emit("onGetPushUrl", 0, {
          pushURL: pushUrl,
          xcxUserId: xcxUserId
        });
      },
      fail: function (res) {
        that.emit("onGetPushUrl", -1, res);
      }
    })
  }

  /**
    *  配置开发者信息
    *  @params strDeveloperId      开发者id
    *  @params strAppId            平台的应用id
    *  @params strAppKey           平台的应用的appKey
    *  @params strAppToken         平台的应用的appToken
    *  API说明                      配置平台开发者信息。
    **/
  initEngine(strDeveloperId, strAppId, strAppKey, strAppToken) {
    var that = this;

    if (typeof strDeveloperId !== "string") {
      throw new Error('[initEngine] strDeveloperId must be string.');
    }
    if (typeof strAppId !== "string") {
      throw new Error('[initEngine] strAppId must be string.');
    }
    if (typeof strAppKey !== "string") {
      throw new Error('[initEngine] strAppKey must be string.');
    }
    if (typeof strAppToken !== "string") {
      throw new Error('[initEngine] strAppToken must be string.');
    }

    that.devId = strDeveloperId;
    that.appId = strAppId;
    that.appKey = strAppKey;
    that.appToken = strAppToken;
    that.useNewApi = false;
  }

  /**
	 *  配置应用token
	 *  @params strUserToken        用户token
	 *  API说明                     配置开发者信息。
	 **/
	setUserToken(strUserToken) {
		var that = this;

		if (typeof strUserToken !== "string") {
			throw new Error('[setUserToken] strUserToken must be string.');
		}
		that.userToekn = strUserToken;
	}

  /**
	 *  配置开发者应用信息
	 *  @params strAppId            应用id
	 *  @params strAppToken         应用的appToken
	 *  API说明                     配置开发者信息
	 **/
	initAppInfo(strAppId, strAppToken) {
		var that = this;

		if (typeof strAppId !== "string") {
			throw new Error('[initAppInfo] strAppId must be string.');
		}
		if (typeof strAppToken !== "string") {
			throw new Error('[initAppInfo] strAppToken must be string.');
		}

		that.appId = strAppId;
		that.appToken = strAppToken;
		that.useNewApi = true;
	}

  /**
	 *  配置服务
	 *  @params strAddress      配置服务地址
	 *  @params nPort           配置服务端口
	 *  API说明                 配置服务信息。默认不需要配置。
	 **/
	configServer (strAddress, nPort) {
		var that = this;

		if (typeof strAddress !== "string") {
			throw new Error('[configServer] strAddress must be string.');
		}

    that.url = strAddress;

		if (nPort) {
			that.svrUrl = "ws://" + that.url + ':' + nPort;
		} else {
			that.svrUrl = "wss://" + that.url + that.urlSuffix;
		}
	}

  /**
   *    加入RTC连线
   *    @params strAnyrtcId     在开发者业务系统中保持唯一标识（理解为房间号）
   *    @params strUserId       主播在开发者自己平台的id（可选）    若不设置发消息接口不能使用
   *    @params strUserData     主播在开发者自己平台的相关信息（昵称，头像等）（可选）       (512字节之内)
   **/
  joinRTCLine(strAnyrtcId, strUserId, strUserData) {
    var that = this;

    if (typeof strAnyrtcId !== "string") {
      throw new Error('[joinRTCLine] strAnyrtcId must be string.');
    }
    that.anyrtcId = strAnyrtcId;

    if (typeof strUserId !== "string") {
      throw new Error('[joinRTCLine] strUserId must be string.');
    }
    that.userId = strUserId;

    if (typeof strUserData !== "string") {
      throw new Error('[joinRTCLine] strUserData must be string.');
    } else {
      if (that.strlen(strUserData) > 512) {
        throw new Error('[joinRTCLine] strUserData is out of length.');
      }
    }
    that.userData = strUserData;

    ///-------------------------------
    that.Logcat("Do joinRTC ......");
    that.doInitWSocket();
  }

  /**
   *  申请连麦
   *  @params strBrief     申请连麦请求的消息
   **/
  applyRTCLine(strBrief) {
    var that = this;
    if (that.applyLine == false) {
      that.applyLine = true;
      var objMsg = {};
      objMsg["Cmd"] = "ApplyLine";
      objMsg["Brief"] = strBrief;
      that.doSendMessage(JSON.stringify(objMsg));
    }
  }

  /**
   *  挂断连麦
   **/
  hangupRTCLine() {
    var that = this;

    that.applyLine = false;
    /**
    1, 从小程序的房间里面退出来
    */
    var objMsg = {};
    objMsg["Cmd"] = "CancelLine";
    that.doSendMessage(JSON.stringify(objMsg));
  }

  /**
   *  销毁游客端对象
   **/
  clear() {
    var that = this;

    that.events = {};
    /**
    1, 从小程序的房间里面退出来
    */

    if (that.my_id != "") {
      var objMsg = {};
      objMsg["Cmd"] = "Leave";
      that.doSendMessage(JSON.stringify(objMsg));

      that.my_id = "";
      that.isAudioLive = false;
    }

    that.doUnInitWSocket();
  }
}

module.exports = XcxGuestKit;