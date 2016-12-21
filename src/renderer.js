let renderer = new THREE.WebGLRenderer({
    alpha: true, 
    canvas: document.querySelector("#webgl-canvas")
  }),
  scene = new THREE.Scene(),
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 5000)