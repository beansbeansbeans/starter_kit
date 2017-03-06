import sharedState from './sharedState'

const camera = new THREE.OrthographicCamera( sharedState.get('windowWidth') / - 2, sharedState.get('windowWidth') / 2, sharedState.get('windowHeight') / 2, sharedState.get('windowHeight') / - 2, 1, 1000 ),
  scene = new THREE.Scene()

let opts = {}

export default {
  initialize(config) {
    opts = config
    renderer = new THREE.WebGLRenderer({ canvas: opts.element, alpha: true })

    renderer.setSize(200, 200)
  }
}