export const getData = url =>
  fetch(`data/${url}.json`).then(data => data.json())

export const getEricData = url =>
  fetch(`eric_data/${url}.json`).then(data => data.json())

export const getShader = url =>
  fetch(`shaders/${url}.glsl`).then(response => response.text())