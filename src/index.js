import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown } = helpers
import "../main.scss"
import renderer from './renderer'
import { getData } from './api'
import TweetList from './components/tweetList'

const textureLoader = new THREE.TextureLoader(),
  assets = {
    particleSprite: { filename: "particle.png" }
  },
  preload = {
    getTextures: () =>
      Promise.all(Object.keys(assets).map(k =>
        new Promise((resolve, reject) => {
          textureLoader.load(`images/${assets[k].filename}`, data => {
            assets[k].data = data
            resolve(data)
          })
          }, () => {},
          xhr => reject(new Error(`could not load ${k}`)))        
      )),
    getData: () =>
      Promise.all(['viz_nodes', 'viz_edges', 'viz_retweets', 'viz_tweets'].map(getData))
        .then(data => {
          nodes = data[0]
          edges = data[1]
          retweets = data[2]
          tweets = data[3].map(t => ({ 
            ...t, 
            active: false 
          }))

          // must be multiples of 3 so webgl doesn't complain
          nodes.splice(roundDown(nodes.length, 3))
          edges.splice(roundDown(edges.length, 3))
        })
  }

let nodes, edges, tweets, retweets

class App extends Component {
  state = {
    tweets: tweets
  }

  componentWillMount() {
    this.clickTweet = this.clickTweet.bind(this)
  }

  clickTweet(id) {
    this.setState({
      tweets: this.state.tweets.map(t => {
        if(t._id === id) {
          t.active = !t.active
        } else {
          t.active = false
        }
        return t
      })
    })
  }

  render({}, { tweets }) {
    return (
      <app>
        <canvas id="webgl-canvas"></canvas>
        <TweetList 
          clickTweet={this.clickTweet}
          tweets={tweets} />
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  render(<App />, document.body);

  renderer.initialize({
    element: document.querySelector("#webgl-canvas"),
    nodes, edges,
    particleSprite: assets.particleSprite.data
  })
})

