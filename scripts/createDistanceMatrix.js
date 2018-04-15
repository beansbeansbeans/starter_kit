var fs = require('fs')

let distanceType = 'euclidean'
let dimensions = 100
let dimensionalities = [10, 50, 100]
let distanceTypes = ['euclidean', 'manhattan']

let getDistance = {
  'euclidean': function(vec) {
    let res = 0
    for(let i=0; i<vec.length; i++) {
      res += Math.pow(vec[i], 2)
    }
    return Math.sqrt(res)
  },
  'manhattan': function(vec) {
    let res = 0
    for(let i=0; i<vec.length; i++) {
      res += Math.abs(vec[i])
    }
    return res
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

let size = 10749
let indices = []
for(let i=0; i<size; i++) indices.push(i)
indices = shuffle(indices)

fs.readFile(`./data/encodings_pca_100.json`, function(err, rawPCA100) {
  fs.readFile(`./data/encodings_pca_50.json`, function(err, rawPCA50) {
    fs.readFile(`./data/encodings_pca_10.json`, function(err, rawPCA10) {
      let pca = {
        10: permute(JSON.parse(rawPCA10), indices).slice(0, 500),
        50: permute(JSON.parse(rawPCA50), indices).slice(0, 500),
        100: permute(JSON.parse(rawPCA100), indices).slice(0, 500)
      }

      let distanceMatrices = {}, distances = {}

      distanceTypes.forEach(t => {
        distanceMatrices[t] = {}
        distances[t] = {}
        dimensionalities.forEach(d => {
          distanceMatrices[t][d] = []
          distances[t][d] = []
        })
      })

      for(let i=0; i<pca['100'].length; i++) {
        distanceTypes.forEach(t => {
          dimensionalities.forEach(d => distanceMatrices[t][d].push([]))
        })
      }

      for(let i=0; i<pca['100'].length; i++) {
        distanceTypes.forEach(t => {
          dimensionalities.forEach(d => {
            distances[t][d][i] = {}
            distanceMatrices[t][d][i][i] = 0
          })          
        })

        for(let j=i+1; j<pca['100'].length; j++) {
          let target = pca[j]
          let dist = {}
          distanceTypes.forEach(t => {
            dist[t] = {}
            dimensionalities.forEach(d => {
              dist[t][d] = getDistance[t](subVectors(pca[d][j].encoding, pca[d][i].encoding))
            })
          })

          distanceTypes.forEach((t, ti) => {
            dimensionalities.forEach((d, di) => {
              distances[t][d][i][j] = dist[t][d]
              distanceMatrices[t][d][i].push(dist[t][d])
              distanceMatrices[t][d][j][i] = dist[t][d]
            })
          })
        }
      }

      fs.writeFile("./data/distance_matrix_sentences.json", JSON.stringify(pca['100'].map(d => {
        return {
          sentence: d.sentence,
          encoding: d.encoding          
        }
      })), function(err) {
        console.log("done printing sentences")
      })

      distanceTypes.forEach(t => {
        dimensionalities.forEach(d => {
          fs.writeFile(`./data/distance_matrix_arr_${t}_${d}.json`, JSON.stringify(distanceMatrices[t][d]), function(err) {
            console.log("distance matrix", t, d)
          })

          fs.writeFile(`./data/distance_matrix_${t}_${d}.json`, JSON.stringify(distances[t][d]), function(err) {
            console.log("distance", t, d)
          })
        })
      })
    })
  })
})