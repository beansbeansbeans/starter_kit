const channels = {}

const subscribe = (channel, cb, once = false) => {
  if(!channels[channel]) {
    channels[channel] = []
  }

  channels[channel].push({ cb, once })  
}

const publish = (channel, data) => {
  if(!channels[channel]) { return }
  
  let toDelete = []

  channels[channel].forEach((d, i) => {
    d.cb(data)
    if(d.once) toDelete.push(i)
  })

  for(let i=0; i<toDelete.length; i++) {
    channels[channel].splice(toDelete[i] - i, 1)
  }
}

export default { subscribe, publish }

window.fire = function() {
  publish("manualReconcile")
}