# Operation Manual for Dataflow Design by Transformation

This document describes the concepts of operation for the Dataflow Design
by Transformation system. It outlines the key components, their
interactions, and how to effectively use the system.

## Key Concept

The key concpet of this application is that is a palette and a canvas. The
palette has a set of components that can be dragged onto the canvas. The
canvas is where the user can design their dataflow by connecting these
components.

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
scrollable if the user has a large number of components on it. You should
be able to right click on a node and select "edit properties" to open a
modal dialog that allows the user to edit the properties of the component.

The canvas should allow the user to drag and drop components from the
palette onto the canvas. The user should be able to click and drag a wire
from the output port of one component to the input port of
anothercomponent. The user should also be able to click and drag a
component to move it around the canvas. The user should be able to delete a
component by right clicking on it and selecting "delete". The user should
be able to select multiple components by holding down the shift key and
clicking on them. The user should be able to delete multiple components by
right clicking on one of the selected components and selecting "delete".

The application should have a top bar that allows the user to save their
design, load a design, and clear the canvas. The save and load functionality
should use the browser's local storage to persist the design. The design
should be saved as a JSON object that contains the components, their
properties, and the connections between them.