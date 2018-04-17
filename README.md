    $ npm install
    $ npm run start

embedding spiral implementation steps

- dropdown with sentence options
- show one sentence's embedding spiral
- print progressions

---

embeddings 10d implementation steps

- DONE - add all new sentences in encodings to `rt-polarity` file and regenerate embeddings (replace the base sentence containing "exploring" - the original data file has it spelled incorrectly as "exporing")
- DONE - revive front-end functionality to see only the base sentences
- DONE - list the alternative sentences in the UI
- render another plot for the first `alt` sentence
- make it possible for the user to change which `alt` sentence is rendered

FINAL: DON'T FORGET TO REGENERATE SENTENCES DICT FOR WASSERSTEIN DISTANCE MATRIX / PAIRWISE COMPONENT AFTER CREATING NEW EMBEDDINGS