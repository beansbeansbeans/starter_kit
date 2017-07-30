SOLVING PROCEDURE

- propagate value upwards and downwards (depth-first traversal of child nodes)
- propagate value downwards from the root 
- if any node has a value already, ignore it (do not assign again to it)
- keep note of the seed node id - once you hit it in the 2nd pass, ignore any of its descendants (because they will have already been assigned to)

RENDERING PROCEDURE

maybe...

the buffer should be in terms of actual screen coordinates,
(regardless of how i solve this - actual screen coordinates should enter the picture at some point)

(figure out where -1 +1 maps onto the screen - that will help me determine the multiplication factor)

