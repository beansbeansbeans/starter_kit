var fs = require('fs')

fs.readFile('./data/distance_matrix_wasserstein_100.json', function(err, raw) {
  let data = JSON.parse(raw)

  let keys = Object.keys(data)
  let arr = []
  for(let i=0; i<data.length; i++) arr.push([])

  for(let i=0; i<data.length; i++) {
    let row = data[i]
    let rowKeys = Object.keys(row).sort((a, b) => {
      if(+a < +b) {
        return -1
      }
      return 1
    })

    arr[i][i] = 0
    
    for(let j=0; j<rowKeys.length; j++) {
      let col = rowKeys[j]
      arr[i][col] = row[col]
      arr[col][i] = row[col]
    }
  }

  console.log(arr.length)
  console.log(arr[0].length)
  console.log(arr[1].length)

  console.log(arr[15][16])
  console.log(arr[16][15])

  fs.writeFile('./data/distance_matrix_arr_wasserstein_100.json', JSON.stringify(arr), function() {
    console.log("done")
  })
})