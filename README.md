    $ npm install
    $ npm run start

embedding spiral implementation steps

- dropdown with sentence options
- show one sentence's embedding spiral
- print progressions

---

distance matrix next steps

- render a rectangle that moves with the user's cursor

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