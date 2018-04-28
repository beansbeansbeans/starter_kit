import sharedState from './sharedState'
import { debounce } from 'underscore'
import mediator from './mediator'

export const handleResize = () => {
  sharedState.set("windowWidth", window.innerWidth)
  sharedState.set("windowHeight", window.innerHeight)
}

window.addEventListener("resize", debounce(handleResize, 250))

window.addEventListener("mousemove", e => {
  sharedState.set("mouseX", e.clientX)
  sharedState.set("mouseY", e.clientY)

  mediator.publish("mousemove", { 
    x: e.clientX, 
    y: e.clientY 
  })
})

window.addEventListener("click", e => {
  mediator.publish("mousedown", e)
})

window.addEventListener("mouseleave", e => {
  mediator.publish("mouseleave", e)
})