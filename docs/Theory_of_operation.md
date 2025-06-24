# Operation Manual for Dataflow Design by Transformation

This document describes the concepts of operation for the Dataflow Design
by Transformation system. It outlines the key components, their
interactions, and how to effectively use the system.

## Key Concept

The key concpet of this application is a palette and a canvas. The palette
has a set of components that can be dragged onto the canvas. The canvas is
where the user can design their dataflow by connecting these components.

Components are connected with wires. Components have input ports and output
ports. Wires connect the output port of one component to the input port of
another component.

Components also have properties. The main properties points to a python
file that represents the behavior of the component. Other properties can be
defined by the user such as the name of the component, its description, and
any additional metadata. Also, the properties define how many input and
output ports the component has.

## Implementation details

The application should be implemented using the React web framework.

The palette should be on the left side of the screen and the canvas on the
right in a 30/70 split layout. The palette should be scrollable if there
are too many components to fit on the screen. The canvas should be
scrollable if the user has a large number of components on it.

When you click on a node in the canvas, a properties panel should slide out
from the right.

The canvas should allow the user to drag and drop components from the
palette onto the canvas. The user should be able to click and drag a wire
from the output port of one component to the input port of
anothercomponent. The user should also be able to click and drag a
component to move it around the canvas. The user should be able to delete a
component by right clicking on it and selecting "delete" or by using the
keyboard. The user should be able to select multiple components by holding
down the shift key and clicking on them. The user should be able to delete
multiple components by right clicking on one of the selected components and
selecting "delete" or by using the keyboard.

Clicking on the canvas and dragging should create a lasso selection box
that allows the user to select multiple components.

The application should have a top bar that allows the user to save their
design, load a design, and clear the canvas. The save and load
functionality should use JSON files that are loaded from and saved to the
local file system. The design should be saved as a JSON file that contains
the components, their properties, and the connections between them.

The palette should have two predefined components: a source node and a sink
node. The source node should have one output port and no input ports. The
sink node should have one input port and no output ports.

The palette should also have a save palette button and a load palette
button. The save palette button should allow the user to save the current
palette, minus the predefined components, to a JSON file on the local file
system. The load palette button should allow the user to load a palette
from a JSON file on the local file system. On load, if there are nodes with
the same node type, an increasing number should be appended to the type of
the node to avoid conflicts. For example, if there is a node type "MyNode"
and the user loads a palette with another "MyNode", the second one should
be renamed to "MyNode1".

The following keyboard shortcuts should be implemented:

- Copy (`Ctrl/Cmd+C`): Copy selected nodes.
- Paste (`Ctrl/Cmd+V`): Paste copied nodes (with wires between them, if
  both endpoints are included).
- Delete (`Delete` or `Backspace`): Delete selected nodes.
- Select All (`Ctrl/Cmd+A`): Select all nodes on the canvas.
- Deselect (`Escape`): Deselect all nodes.

When pasting nodes, any wires between the copied nodes are also duplicated.
