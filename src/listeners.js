import sharedState from './sharedState'
import { debounce } from 'underscore'
import mediator from './mediator'
import renderer from './GPURenderer'

export const handleResize = () => {
  sharedState.set("windowWidth", window.innerWidth)
  sharedState.set("windowHeight", window.innerHeight)

  const rect = document.querySelector("#webgl-wrapper").getBoundingClientRect()
  sharedState.set("containerWidth", rect.width)
  sharedState.set("containerHeight", rect.height)

  renderer.resize()
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

window.addEventListener("mousedown", e => {
  mediator.publish("mousedown", e)
})

window.addEventListener("mouseleave", e => {
  mediator.publish("mouseleave", e)
})