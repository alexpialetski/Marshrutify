import go from "gojs";

const $ = go.GraphObject.make;

type UmlClassVisibility = "public" | "private" | "protected" | "package";

type UmlClassRelationship =
  | "Association"
  | "Realization"
  | "Dependency"
  | "Composition"
  | "Aggregation";

type ClassMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

type ClassProperties<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
}[keyof T];

type UmlClassProperty<T extends string | number | symbol> = {
  name: T;
  type: string;
  visibility: UmlClassVisibility;
  default?: string;
};

type UmlClassMethod<T extends string | number | symbol> = {
  name: T;
  parameters?: { name: string; type: string }[];
  type?: "string" | "Promise";
  visibility: UmlClassVisibility;
};

export type UmlClassNodeData<T> = {
  key: number;
  name: string;
  properties?: UmlClassProperty<ClassProperties<T>>[];
  methods?: UmlClassMethod<ClassMethods<T>>[];
};

export type UmlClassLinkData = {
  from: number;
  to: number;
  relationship?: UmlClassRelationship;
};

// show visibility or access as a single character at the beginning of each property or method
const convertVisibility = (v: string): string => {
  switch (v) {
    case "public":
      return "+";
    case "private":
      return "-";
    case "protected":
      return "#";
    case "package":
      return "~";
    default:
      return v;
  }
};

// https://gojs.net/latest/samples/umlClass.html
export const renderUMLClassDiagram = (
  element: HTMLElement,
  model: go.Model
): void => {
  const diagram = new go.Diagram(element, {
    "undoManager.isEnabled": true,
    layout: $(go.TreeLayout, {
      // this only lays out in trees nodes connected by "generalization" links
      angle: 90,
      path: go.TreeLayout.PathSource, // links go from child to parent
      setsPortSpot: false, // keep Spot.AllSides for link connection spot
      setsChildPortSpot: false, // keep Spot.AllSides
      // nodes not connected by "generalization" links are laid out horizontally
      arrangement: go.TreeLayout.ArrangementHorizontal,
    }),
  });

  // the item template for properties
  var propertyTemplate = $(
    go.Panel,
    "Horizontal",
    // property visibility/access
    $(
      go.TextBlock,
      { isMultiline: false, editable: false, width: 12 },
      new go.Binding("text", "visibility", convertVisibility)
    ),
    // property name, underlined if scope=="class" to indicate static property
    $(
      go.TextBlock,
      { isMultiline: false, editable: true },
      new go.Binding("text", "name").makeTwoWay(),
      new go.Binding("isUnderline", "scope", (s) => s[0] === "c")
    ),
    // property type, if known
    $(go.TextBlock, "", new go.Binding("text", "type", (t) => (t ? ": " : ""))),
    $(
      go.TextBlock,
      { isMultiline: false, editable: true },
      new go.Binding("text", "type").makeTwoWay()
    ),
    // property default value, if any
    $(
      go.TextBlock,
      { isMultiline: false, editable: false },
      new go.Binding("text", "default", (s) => (s ? " = " + s : ""))
    )
  );

  // the item template for methods
  var methodTemplate = $(
    go.Panel,
    "Horizontal",
    // method visibility/access
    $(
      go.TextBlock,
      { isMultiline: false, editable: false, width: 12 },
      new go.Binding("text", "visibility", convertVisibility)
    ),
    // method name, underlined if scope=="class" to indicate static method
    $(
      go.TextBlock,
      { isMultiline: false, editable: true },
      new go.Binding("text", "name").makeTwoWay(),
      new go.Binding("isUnderline", "scope", (s) => s[0] === "c")
    ),
    // method parameters
    $(
      go.TextBlock,
      "()",
      // this does not permit adding/editing/removing of parameters via inplace edits
      new go.Binding("text", "parameters", (parr) => {
        var s = "(";
        for (var i = 0; i < parr.length; i++) {
          var param = parr[i];
          if (i > 0) s += ", ";
          s += param.name + ": " + param.type;
        }
        return s + ")";
      })
    ),
    // method return type, if any
    $(go.TextBlock, "", new go.Binding("text", "type", (t) => (t ? ": " : ""))),
    $(
      go.TextBlock,
      { isMultiline: false, editable: true },
      new go.Binding("text", "type").makeTwoWay()
    )
  );

  // this simple template does not have any buttons to permit adding or
  // removing properties or methods, but it could!
  diagram.nodeTemplate = $(
    go.Node,
    "Auto",
    {
      locationSpot: go.Spot.Center,
      fromSpot: go.Spot.AllSides,
      toSpot: go.Spot.AllSides,
    },
    $(go.Shape, { fill: "lightyellow" }),
    $(
      go.Panel,
      "Table",
      { defaultRowSeparatorStroke: "black" },
      // header
      $(
        go.TextBlock,
        {
          row: 0,
          columnSpan: 2,
          margin: 3,
          alignment: go.Spot.Center,
          font: "bold 12pt sans-serif",
          isMultiline: false,
          editable: true,
        },
        new go.Binding("text", "name").makeTwoWay()
      ),
      // properties
      $(
        go.TextBlock,
        "Properties",
        { row: 1, font: "italic 10pt sans-serif" },
        new go.Binding("visible", "visible", (v) => !v).ofObject("PROPERTIES")
      ),
      $(
        go.Panel,
        "Vertical",
        { name: "PROPERTIES" },
        new go.Binding("itemArray", "properties"),
        {
          row: 1,
          margin: 3,
          stretch: go.GraphObject.Fill,
          defaultAlignment: go.Spot.Left,
          background: "lightyellow",
          itemTemplate: propertyTemplate,
        }
      ),
      $(
        "PanelExpanderButton",
        "PROPERTIES",
        { row: 1, column: 1, alignment: go.Spot.TopRight, visible: false },
        new go.Binding("visible", "properties", (arr) => arr.length > 0)
      ),
      // methods
      $(
        go.TextBlock,
        "Methods",
        { row: 2, font: "italic 10pt sans-serif" },
        new go.Binding("visible", "visible", (v) => !v).ofObject("METHODS")
      ),
      $(
        go.Panel,
        "Vertical",
        { name: "METHODS" },
        new go.Binding("itemArray", "methods"),
        {
          row: 2,
          margin: 3,
          stretch: go.GraphObject.Fill,
          defaultAlignment: go.Spot.Left,
          background: "lightyellow",
          itemTemplate: methodTemplate,
        }
      ),
      $(
        "PanelExpanderButton",
        "METHODS",
        { row: 2, column: 1, alignment: go.Spot.TopRight, visible: false },
        new go.Binding("visible", "methods", (arr) => arr.length > 0)
      )
    )
  );

  function linkStyle() {
    return {
      isTreeLink: false,
      fromEndSegmentLength: 0,
      toEndSegmentLength: 0,
    };
  }

  diagram.linkTemplate = // by default, "Inheritance" or "Generalization"
    $(
      go.Link,
      linkStyle(),
      { isTreeLink: true },
      $(go.Shape),
      $(go.Shape, { toArrow: "Triangle", fill: "white" })
    );

  diagram.linkTemplateMap.add(
    "Association",
    $(go.Link, linkStyle(), $(go.Shape))
  );

  diagram.linkTemplateMap.add(
    "Realization",
    $(
      go.Link,
      linkStyle(),
      $(go.Shape, { strokeDashArray: [3, 2] }),
      $(go.Shape, { toArrow: "Triangle", fill: "white" })
    )
  );

  diagram.linkTemplateMap.add(
    "Dependency",
    $(
      go.Link,
      linkStyle(),
      $(go.Shape, { strokeDashArray: [3, 2] }),
      $(go.Shape, { toArrow: "OpenTriangle" })
    )
  );

  diagram.linkTemplateMap.add(
    "Composition",
    $(
      go.Link,
      linkStyle(),
      $(go.Shape),
      $(go.Shape, { fromArrow: "StretchedDiamond", scale: 1.3 }),
      $(go.Shape, { toArrow: "OpenTriangle" })
    )
  );

  diagram.linkTemplateMap.add(
    "Aggregation",
    $(
      go.Link,
      linkStyle(),
      $(go.Shape),
      $(go.Shape, { fromArrow: "StretchedDiamond", fill: "white", scale: 1.3 }),
      $(go.Shape, { toArrow: "OpenTriangle" })
    )
  );

  diagram.model = model;
};
