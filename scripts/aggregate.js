var fs = require('fs')

let dimensionalities = [10, 50, 100]
// let dimensionalities = [100]
let distanceTypes = ['euclidean', 'manhattan']
let closestCount = 3, resolution = 20

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

const subVectors = (a, b) => {
  let res = []
  for(let i=0; i<a.length; i++) {
    res.push(a[i] - b[i])
  }
  return res
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

let size = 10749
let indices = []
for(let i=0; i<size; i++) indices.push(i)
indices = shuffle(indices)

fs.readFile(`./data/encodings_pca_100.json`, function(err, rawPCA100) {
  fs.readFile(`./data/encodings_pca_50.json`, function(err, rawPCA50) {
    fs.readFile(`./data/encodings_pca_10.json`, function(err, rawPCA10) {
      let aggregations = {}
      let pca = {}

      dimensionalities.forEach(d => {
        let data = permute(JSON.parse(rawPCA100), indices)
        for(let i=0; i<data.length; i++) {
          data[i] = Object.assign(data[i], {
            polarity: data[i].polarity === 'pos' ? 1 : 0
          })
        }

        pca[d] = data
      })

      distanceTypes.forEach(d => {
        aggregations[d] = {}
        dimensionalities.forEach(dim => {
          aggregations[d][dim] = [] // levels
      
          let data = pca[dim]

          for(let scale=0; scale<4; scale++) {
            let newData = []

            for(let j=0; j<data.length; j++) {
              let source = data[j]
              if(source.used) continue

              let vec = source.encoding
              source.used = true

              let closest = []
              closestCount = 2 + Math.floor(Math.random() * 4)

              for(let k=0; k<data.length; k++) {
                let target = data[k]
                if(target.used) continue

                let diff = subVectors(vec, target.encoding)
                let distance = getDistance['euclidean'](diff)
                
                // if it's closer than any of the elements in closer (comment out this if block for random aggregation)
                if(closest.length === closestCount) {
                  let toDelete = -1
                  for(let l=0; l<closest.length; l++) {
                    if(distance < closest[l].distance) {
                      toDelete = l
                      break
                    }
                  }

                  closest.splice(toDelete, 1)
                }

                if(closest.length < closestCount) {
                  closest.push(Object.assign({ distance, index: k }, target))
                }
              }

              for(let k=0; k<closest.length; k++) {
                data[closest[k].index].used = true
              }

              let closestLength = closest.length
              let average = {
                encoding: vec,
                polarity: source.polarity
              } 

              if(closestLength > 0) {
                average = {
                  encoding: vec.map((d, i) => {
                    return (d + closest.reduce((acc, curr) => acc + curr.encoding[i])) / (closestLength + 1)
                  }),
                  polarity: (source.polarity + closest.reduce((acc, curr) => acc + curr.polarity, 0)) / (closestLength + 1)
                }        
              }

              newData.push(average)
            }

            let bins = []
            for(let i=0; i<resolution; i++) bins.push(0)

            for(let i=0; i<data.length; i++) {
              let obj = data[i]

              for(let j=0; j<bins.length; j++) {
                if(obj.polarity <= j / bins.length || j === bins.length - 1) {
                  bins[j]++
                  break
                }
              }
            }

            aggregations[d][dim].push(bins)

            // reset data
            data = newData
          }
        })
      })

      fs.writeFile('./data/aggregations.json', JSON.stringify(aggregations), function(err) {
        console.log("done")
      })
    })
  })
})