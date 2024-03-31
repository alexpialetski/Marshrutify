import go from "gojs";

import { renderStateChart } from "./diagrams/stateChart";
import { renderUMLClassDiagram } from "./diagrams/umlClass";
import { umlClassModel } from "./models/umlClassData";

import stateChartData from "./models/stateChartData.json";

import "./index.css";

function render() {
  const stateChartContainer = document.getElementById("state-chart");
  const umlClassContainer = document.getElementById("uml-class-chart");

  if (stateChartContainer) {
    renderStateChart(stateChartContainer, go.Model.fromJson(stateChartData));
  }

  if (umlClassContainer) {
    renderUMLClassDiagram(umlClassContainer, umlClassModel);
  }
}

render();
