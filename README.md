    $ npm install
    $ npm run start

sentence progressions
- encode a corpus

---

distance matrix next steps

- add option of different corpora, each with different models available
- move presets into corpora
- load in guns + glove data

---

PERMUTATION IN R

Resources:
- http://nicolas.kruchten.com/content/2018/02/seriation/
- https://cran.r-project.org/web/packages/seriation/seriation.pdf
- https://cran.r-project.org/web/packages/seriation/vignettes/seriation.pdf

library("rjson")
library('seriation')

json_file <- "/Users/annyuan/Documents/Projects/tensorflowjs/data/processedDistance.json"
json_data <- fromJSON(file=json_file)
mat <- matrix(c(json_data), nrow=500)
customDist = as.dist(mat)
o <- seriate(customDist, method="TSP")
get_order(o) // REMEMBER TO SUBTRACT 1 FROM THE INDICES
pimage(customDist, o)