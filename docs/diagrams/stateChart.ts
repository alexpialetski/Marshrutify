import go from "gojs";

const $ = go.GraphObject.make;

const GREEN_COLOR = "#52ce60";

// https://gojs.net/latest/samples/stateChart.html
export const renderStateChart = (
  element: HTMLElement,
  model: go.Model
): void => {
  const diagram = new go.Diagram(element, {
    // "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
    "undoManager.isEnabled": true,
  });

  // define the Node template
  diagram.nodeTemplate = $(
    go.Node,
    "Auto",
    {
      locationSpot: go.Spot.Top,
      isShadowed: true,
      shadowBlur: 1,
      shadowOffset: new go.Point(0, 1),
      shadowColor: "rgba(0, 0, 0, .14)",
    },
    new go.Binding("location", "loc", go.Point.parse),
    // define the node's outer shape, which will surround the TextBlock
    $(
      go.Shape,
      "RoundedRectangle",
      {
        parameter1: 2, // set the rounded corner
        spot1: go.Spot.TopLeft,
        spot2: go.Spot.BottomRight, // make content go all the way to inside edges of rounded corners
      },
      {
        name: "SHAPE",
        fill: "#ffffff",
        strokeWidth: 0,
        stroke: null,
        portId: "", // this Shape is the Node's port, not the whole Node
        fromLinkable: true,
        fromLinkableSelfNode: true,
        fromLinkableDuplicates: true,
        toLinkable: true,
        toLinkableSelfNode: true,
        toLinkableDuplicates: true,
        cursor: "pointer",
      }
    ),
    $(
      go.TextBlock,
      {
        font: "bold small-caps 11pt helvetica, bold arial, sans-serif",
        margin: 7,
        stroke: "rgba(0, 0, 0, .87)",
        textAlign: "center",
      },
      new go.Binding("text")
    )
  );

  const getSpotNode = (params: {
    text: string;
    color: string;
    fromLinkable: boolean;
    toLinkable: boolean;
  }): go.Node =>
    $(
      go.Node,
      "Spot",
      { desiredSize: new go.Size(75, 75) },
      new go.Binding("location", "loc", go.Point.parse),
      $(go.Shape, "Circle", {
        fill: params.color,
        stroke: null,
        portId: "",
        fromLinkable: params.fromLinkable,
        fromLinkableSelfNode: params.fromLinkable,
        fromLinkableDuplicates: params.fromLinkable,
        toLinkable: params.toLinkable,
        toLinkableSelfNode: params.toLinkable,
        toLinkableDuplicates: params.toLinkable,
        cursor: "pointer",
      }),
      $(go.TextBlock, params.text, {
        font: "bold 16pt helvetica, bold arial, sans-serif",
        stroke: "whitesmoke",
      })
    );

  diagram.nodeTemplateMap.add(
    "Start",
    getSpotNode({
      color: "maroon",
      text: "Start",
      fromLinkable: true,
      toLinkable: false,
    })
  );

  diagram.nodeTemplateMap.add(
    "End",
    getSpotNode({
      color: GREEN_COLOR,
      text: "End",
      fromLinkable: false,
      toLinkable: true,
    })
  );

  diagram.linkTemplate = $(
    go.Link,
    {
      curve: go.Link.Bezier,
      adjusting: go.Link.Stretch,
      reshapable: true,
      relinkableFrom: true,
      relinkableTo: true,
      toShortLength: 3,
    },
    new go.Binding("points").makeTwoWay(),
    new go.Binding("curviness"),
    $(
      go.Shape,
      { strokeWidth: 1.5 },
      new go.Binding("stroke", "progress", (progress) =>
        progress ? GREEN_COLOR /* green */ : "black"
      ),
      new go.Binding("strokeWidth", "progress", (progress) =>
        progress ? 2.5 : 1.5
      )
    ),
    $(
      go.Shape, // the arrowhead
      { toArrow: "standard", stroke: null },
      new go.Binding("fill", "progress", (progress) =>
        progress ? GREEN_COLOR /* green */ : "black"
      )
    ),
    $(
      go.Panel,
      "Auto",
      $(
        go.Shape, // the label background, which becomes transparent around the edges
        {
          fill: $(go.Brush, "Radial", {
            0: "rgb(245, 245, 245)",
            0.7: "rgb(245, 245, 245)",
            1: "rgba(245, 245, 245, 0)",
          }),
          stroke: null,
        }
      ),
      $(
        go.TextBlock,
        "transition", // the label text
        {
          textAlign: "center",
          font: "9pt helvetica, arial, sans-serif",
          margin: 4,
        },
        new go.Binding("text")
      )
    )
  );

  diagram.model = model;
};
