var fs = require('fs')

let distanceType = 'euclidean'
let dimensions = 100

let getDistance = {
  'euclidean': function() {

  }
}

fs.readFile(`./data/encodings_pca_${dimensions}.json`, function(err, rawPCA) {
  let pca = JSON.parse(rawPCA)
  let distances = []
  console.log("lol")
  console.log(pca.length)

  fs.writeFile(`./data/distance_matrix_${distanceType}_${dimensions}.json`, JSON.stringify(distances), function(err) {
    console.log("done")
  })
})