var fs = require('fs')

let distanceType = 'euclidean'
let dimensions = 100

let getDistance = {
  'euclidean': function(vec) {
    let res = 0
    for(let i=0; i<vec.length; i++) {
      res += Math.pow(vec[i], 2)
    }
    return Math.sqrt(res)
  }
}

function permute(a, p) {
  var r = [];
  for (var i = 0; i < a.length; ++i)
    r.push(a[p[i]]);
  for (i = 0; i < a.length; ++i)
    a[i] = r[i];

  return a
}

function shuffle(array) {
  let counter = array.length;

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    // let index = Math.floor(random.nextDouble() * counter);
    let index = Math.floor(Math.random() * counter);

    // Decrease counter by 1
    counter--;

    // And swap the last element with it
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}

const subVectors = (a, b) => {
  let res = []
  for(let i=0; i<a.length; i++) {
    res.push(a[i] - b[i])
  }
  return res
}

fs.readFile(`./data/encodings_pca_100.json`, function(err, rawPCA100) {
  fs.readFile(`./data/encodings_pca_50.json`, function(err, rawPCA50) {
    fs.readFile(`./data/encodings_pca_10.json`, function(err, rawPCA10) {
      let pca = JSON.parse(rawPCA100)
      let indices = []
      for(let i=0; i<pca.length; i++) indices.push(i)
      indices = shuffle(indices)

      pca = permute(pca, indices).slice(0, 500)

      let distanceMat = []
      let distances = {}
    
      console.log("lol")
      console.log(pca.length)

      for(let i=0; i<pca.length; i++) distanceMat.push([])

      for(let i=0; i<pca.length; i++) {
        let obj = pca[i]
        distances[i] = {}
        distanceMat[i][i] = 0

        for(let j=i+1; j<pca.length; j++) {
          let target = pca[j]
          let dist = getDistance[distanceType](subVectors(target.encoding, obj.encoding))

          distances[i][j] = dist
          distanceMat[i].push(dist)
          distanceMat[j][i] = dist
        }
      }

      fs.writeFile('./data/distance_matrix_arr.json', JSON.stringify(distanceMat), function(err) {
        console.log("done")
      })

      fs.writeFile(`./data/distance_matrix_${distanceType}_${dimensions}.json`, JSON.stringify(distances), function(err) {
        console.log("done")
      })
    })
  })
})