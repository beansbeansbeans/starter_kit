    $ npm install
    $ npm run start

In render:

- first, we set the render flag to false
(in step)
- then, we attach currentState to the computation framebuffer (rendering destination)
- then, we set the values of the texture to be lastState
- then, we compute
- then, we swap the values of currentState and lastState
(back to render)
- then, set render flag to true
- then, we set the values of the texture to be lastState (and remember, lastState now contains the previous values of currentState, which is the freshly computed texture)
- then, set the frameBuffer to null (so webgl knows to actually render)
- then, render to screen