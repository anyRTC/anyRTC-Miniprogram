import { formatNumber } from "../../utils/util";
let displayGroup = [];
let interval;
Component({
  // 当type为空的时候调用插槽，并设置外部类
  externalClasses: ["pop-class"],
  properties: {
    popItem: {
      type: Object,
      value: {},
      observer: function(newVal, oldVal) {
        // console.log(newVal, displayGroup);
        if (newVal && newVal.isShow) {
          const index_bg = 1000 + displayGroup.length * 10;
          this.setData({ _index_bg: index_bg });
          displayGroup.push(newVal);
        } else if (newVal && !newVal.isShow) {
          let idx;
          for (let i = 0; i < displayGroup.length; i++) {
            if (displayGroup[i].type == newVal.type) {
              idx = i;
              break;
            }
          }
          if (idx != null) {
            displayGroup.splice(idx, 1);
          }
          // console.log("delete", displayGroup);
        }
        const _popItem = Object.assign(this.data._popItem, this.data.popItem);
        this.setData({ _popItem });
        if (_popItem.type == "common") {
          this._typeWithCommon(_popItem);
        }
      }
    }
  },
  data: {
    _popItem: {
      //若修改属性，则每次都需要传入修改的属性，否则延续使用上次修改值
      type: "", // 弹出框的类型 空值为slot形式
      isCenter: true,
      isShow: false,
      isBgTap: true,
      isMask: true
    }
  },
  methods: {
    _close() {
      const _popItem = Object.assign(this.data._popItem, { isShow: false });
      this.setData({ _popItem });
      this._typeWithCommon(_popItem);
      //发送事件
      this.triggerEvent("close");
    },
    _catchtouchmove() {},
    _typeWithCommon(popItem) {
      const _popItem = popItem;
      let time = 1;
      if (!_popItem.isShow) {
        clearInterval(interval);
        _popItem.waitingMin = `01秒`;
        this.setData({ _popItem });
        return;
      }
      interval = setInterval(() => {
        time += 1;
        const min =
          time >= 60
            ? `${formatNumber(parseInt(time / 60))}分${formatNumber(
                time % 60
              )}秒`
            : `${formatNumber(time % 60)}秒`;
        _popItem.waitingMin = `${min}`;
        this.setData({ _popItem });
      }, 1000);
    }
  }
});
