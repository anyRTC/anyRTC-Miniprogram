export default class Log {
  constructor() {
    this.debug = true;
  }

  Logcat(...args) {
    if (this.debug) {
      console.log.call(console, `${new Date().toLocaleString()}anyRTC SDK [DEFAULT]: `, args);
    }
  }
}