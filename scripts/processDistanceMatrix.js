var fs = require('fs')

fs.readFile('./data/distance_matrix_arr_wasserstein_100.json', function(err, rawMat) {
  let mat = JSON.parse(rawMat)

  let flattened = mat.reduce((acc, curr) => {
    return acc.concat(curr)
  }, [])

  console.log(flattened.length)

  fs.writeFile('./data/processedDistance.json', JSON.stringify(flattened), function(err) {
    console.log("done")
  })
})