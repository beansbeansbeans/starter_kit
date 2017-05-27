    $ npm install
    $ npm run start

PARAMS:
- neighborhood size
- number of orientations
- amount of empty space
- whether to move happy particles
- amount of randomness to introduce

PARTICLES TEXTURE:
- contains ideology
- is the same size as the rendering canvas, so positional information will be encoded that way

GRADIENT TEXTURE:
- contains diversity information for both orientations
- is coarser than the particles texture

MOVEMENT:
- with some randomness, move unhappy particles in the direction of the highest gradient
- with some randomness, move happy particles in direction of equal happiness (without stepping on existing particles)
- after moves are made, resolve conflicts so particles don't occupy the same space


FIRST CUT:
- particles of 2 orientations randomly moving 
- and not colliding

alpha: orientation

structure:

a particles texture controls the positions of the particles


---

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

--- 

FOR MANY VARIABLES

In init:

- create a program for each fragment that's doing computation, including a program for the rendering fragment

In render:

- set program to the different variables, and call "step" from GPUmath
