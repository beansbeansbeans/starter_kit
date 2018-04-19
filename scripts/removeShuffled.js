var fs = require('fs')

fs.readFile('./eric_data/skip_shuffle_dists.pkl.json', function(err, raw) {
  let data = JSON.parse(raw)
  let shortened = data
  let max = 50

  shortened.forEach(d => {
    let distances = Object.keys(d.dists)
    distances.forEach(dist => {
      d.dists[dist] = d.dists[dist].slice(0, max)
    })

    d.manipulated_embs = d.manipulated_embs.slice(0, max)

    d.manipulated_sents = d.manipulated_sents.slice(0, max)
  })

  fs.writeFile('./eric_data/skip_shuffle_dists.pkl.json', JSON.stringify(shortened), function(err) {
    console.log("done")
  })
})