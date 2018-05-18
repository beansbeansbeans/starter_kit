import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { bindAll } = helpers
import "../main.scss"
import { getData } from './api'
import { debounce, defer } from 'underscore'
import sharedState from './sharedState'
import mediator from './mediator'

const preload = {
  getData: () => 
    Promise.all(['sample'].map(getData))
      .then(data => {

      })
  }

class App extends Component {
  render({ }) {
    return <div></div>
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  render(<App />, document.body)
})