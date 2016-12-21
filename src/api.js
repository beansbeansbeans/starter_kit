export const getData = url =>
  fetch(`data/${url}.json`).then(data=>data.json())