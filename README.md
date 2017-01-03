    $ npm install
    $ npm run start

localhost:3000

ngraph.quadtreebh3d/index.js
----------------------------

Below is a prose overview of what this module does. The goal is to understand it well enough in order to implement a shader version.

Preliminary questions:
- Where does the derivative of the gravitational formula come in? (The one where you divide by r^3) How comes it doesn't play a role in the Princeton implementation?

OVERVIEW

- insert: a method to insert a body into the octtree. this method must be called every frame for every body.
- insertStack: this module is basically just an array, but sometimes it reuses elements to save memory
- update: accepts a body, updates the forces on the body

THE API: (rigorously understand - this is the part that I'll try to implement in a compute shader)
