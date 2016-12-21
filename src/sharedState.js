const obj = {
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight
}

export default {
  set: function(key, val) {
    obj[key] = val
  },

  get: function(key) {
    if(obj[key]) {
      return obj[key]
    }
    return false
  }
}