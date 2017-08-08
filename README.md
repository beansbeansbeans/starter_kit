SOLVING PROCEDURE

- propagate value upwards and downwards (depth-first traversal of child nodes)
- propagate value downwards from the root 
- if any node has a value already, ignore it (do not assign again to it)
- keep note of the seed node id - once you hit it in the 2nd pass, ignore any of its descendants (because they will have already been assigned to)

RENDERING PROCEDURE

constraint0: seed argument occupies all available height
constraint1: children of an argument collectively occupy all of their parent's height
constraint2: rectangles in the right-most column are the same height

when a new argument is introduced:
- columns en-narrow to accommodate (if it's a new depth)
- heights readjust so that constraints 1 and 2 are satisfied

implementation:
- DONE - render it statically through breadth-first search
- DONE - render it incrementally / randomly - moving through the tree
- DONE - render to webgl

- animate

the issue is: every argument needs a unique position within the top, left, and heights arrays

so, create an object mapping _id's to indices