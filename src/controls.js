import { debounce } from 'underscore'
import mediator from './mediator'

THREE.Controls = function(camera, node, graph, minZoom, maxZoom) {
  var panMag = 0.5,
    dragging = false,
    autoRotating = false,
    velocity = 0,
    zoomTarget = new THREE.Vector3(),
    wheelDelta = 0,
    lastMousePosition = new THREE.Vector2(),
    mousePosition = new THREE.Vector2(0.5, 0.5),
    dragDirection = new THREE.Vector2(),
    frame = {
      width: window.innerWidth,
      height: window.innerHeight
    },
    self = this

  function resetLastMousePosition() {
    lastMousePosition.copy(mousePosition)
  }

  function rotate() {
    if(!dragging) { return }

    graph.rotation.x += mousePosition.y - lastMousePosition.y
    graph.rotation.y += mousePosition.x - lastMousePosition.x

    resetLastMousePosition()    
  }

  function autoRotate() {
    if(!autoRotating) { return }

    graph.rotation.x += dragDirection.y * velocity * 100
    graph.rotation.y += dragDirection.x * velocity * 100

    velocity = velocity * 0.7

    if(velocity < 0.0001) { autoRotating = false }
  }

  var zoom = function() {
    zoomTarget.set(mousePosition.x * 2 - 1, -mousePosition.y * 2 + 1, 1)

    zoomTarget.unproject(camera)
    zoomTarget.sub(camera.position)

    camera.position.addVectors(camera.position, zoomTarget.setLength(-wheelDelta))

    camera.updateMatrixWorld()
  }.bind(this)

  this.update = function() {
    rotate()
    autoRotate()
    zoom()
  }

  this.pan = function(direction) {

  }

  var mousemove = (function() {
    var newPosition = new THREE.Vector2(),
      direction = new THREE.Vector2()

    return function mousemove(e) {
      e.preventDefault()

      var x = e.pageX / frame.width, y = e.pageY / frame.height

      newPosition.set(x, y)

      direction = newPosition.sub(mousePosition)

      if(dragging) {
        dragDirection.copy(direction) 
        velocity = direction.length()
      }

      mousePosition.set(x, y)     
    }
  }())

  var wheel = function(e) {
    e.preventDefault()
    e.stopPropagation()

    var delta = e.deltaY

    autoRotating = false
    // if((delta < 0 && camera.position.z < -200) || delta > 0 && camera.position.z > 1000) {
    //   wheelDelta = 0
    // } else {
      wheelDelta = delta
    // }
  }.bind(this)

  var wheelEnd = function() { wheelDelta = 0 }

  resetLastMousePosition()

  node.addEventListener('mousedown', function() {
    autoRotating = false
    resetLastMousePosition()

    dragging = true

    setTimeout(function() {
      if(dragging) {
        mediator.publish('dragging')
      }
    }, 100)
  })

  node.addEventListener('mouseup', function() {
    dragging = false

    if(velocity > 0) {
      autoRotating = true
    }
  })

  node.addEventListener('mousemove', mousemove)

  node.addEventListener('wheel', wheel)

  node.addEventListener('wheel', debounce(wheelEnd, 150))
}

THREE.Controls.prototype = Object.create(THREE.EventDispatcher.prototype)
THREE.Controls.prototype.constructor = THREE.Controls