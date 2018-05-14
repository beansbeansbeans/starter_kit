    $ npm install
    $ npm run start

sentence progressions
- encode a corpus

---

distance matrix next steps

- add option of different corpora, each with different models available
- move presets into corpora


- add movie corpus

- load in guns + glove data

- load in the rest of the guns data

- what is "distance_matrix_sentences"?




---

PERMUTATION IN R

Resources:
- http://nicolas.kruchten.com/content/2018/02/seriation/
- https://cran.r-project.org/web/packages/seriation/seriation.pdf
- https://cran.r-project.org/web/packages/seriation/vignettes/seriation.pdf

library("rjson")
library('seriation')

json_file <- "/Users/annyuan/Desktop/DISTILL_DATA/ann_dist_matrix/guns/quick-thought/processedDistance_pca-100_minkowski-10.json"
json_data <- fromJSON(file=json_file)
mat <- matrix(c(json_data), nrow=500)
customDist = as.dist(mat)
o <- seriate(customDist, method="TSP")
x <- toString(shQuote(lapply(o, function(x) x - 1), type = "cmd"))
gsub("[\r\n]", "", x)



pimage(customDist, o)
