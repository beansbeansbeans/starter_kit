var fs = require('fs')

var array = []

fs.readFile('./data/edges.json', function(err, content) {
  var parsed = JSON.parse(content), createNewFile = false
  console.log(parsed.length)

  parsed.forEach(function(d) {
    if(!array.find(function(s) {
      return s[0] === d.source && s[1] === d.target
    })) {
      if(!array.find(function(s) {
        return s[0] === d.target && s[1] === d.source
      })) {
        array.push([d.source, d.target])
      } else {
        console.log("create new file")
        createNewFile = true
      }
    }
  })

  console.log(array.length)

  if(createNewFile) {
    fs.writeFile('/tmp/edges.json', JSON.stringify(array.map(function(d) {
      return {
        source: d[0],
        target: d[1]
      }
    })), function() {
      console.log("done")
    })
  }
})