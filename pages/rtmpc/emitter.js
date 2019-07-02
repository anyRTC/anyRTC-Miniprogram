import Log from './log.js';

export default class EventEmitter extends Log {
  constructor() {
    super();
    this.events = {};
  }

  //绑定事件函数
  on(eventName, callback) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(callback);
  };
  //触发事件函数
  emit(eventName, _) {
    var events = this.events[eventName],
      args = Array.prototype.slice.call(arguments, 1),
      i, m;

    if (!events) {
      return;
    }
    for (i = 0, m = events.length; i < m; i++) {
      events[i].apply(null, args);
    }
  }
}