var fs = require('fs')

fs.readFile('./data/encodings_pca_100.json', function(err, pca100) {
  fs.readFile('./data/encodings_pca_50.json', function(err, pca50) {
    fs.readFile('./data/encodings_pca_10.json', function(err, pca10) {
      pca100 = JSON.parse(pca100)
      pca50 = JSON.parse(pca50)
      pca10 = JSON.parse(pca10)

      for(let i=0; i<pca10.length; i++) {
        pca10[i] = Object.assign(pca10[i], { id: i })

        pca50[i] = Object.assign(pca50[i], { id: i })

        pca100[i] = Object.assign(pca100[i], { id: i })
      }

      fs.writeFile('./data/encodings_pca_10.json', JSON.stringify(pca10), function(err) {
        console.log("done")
      })
      fs.writeFile('./data/encodings_pca_50.json', JSON.stringify(pca50), function(err) {
        console.log("done")
      })
      fs.writeFile('./data/encodings_pca_100.json', JSON.stringify(pca100), function(err) {
        console.log("done")
      })
    })
  })
})