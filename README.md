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

- encode all the sentences and dump them into a json file that we fetch

