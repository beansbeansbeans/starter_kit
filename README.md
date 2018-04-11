    $ npm install
    $ npm run start


permutations implementation steps:

(in config file)

embeddings = {
  'sentence': [vec],
  ...
}

state = {
  sets: [
    {
      label: '1',
      sentence: 'I finally ate lunch'
    },
    {
      label: '2',
      sentence: 'this movie sucked'
    }
  ]
}

permutations can be derived from the sentence alone
permutations: take an array of indices representing each word, at each step perform a random transformation (choose an index randomly, then move it randomly to the left or to the right)
then undo these transformations

assume for now that i have all the embeddings

- dropdown: choose a sentence
- list all the progressions of each of the three sets of permutations
- dropdown: choose dimensionality
- render a circle for the base sentence