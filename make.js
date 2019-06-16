function makeStation() {
  const stationData = require("./vertices.js");
  const result = {};

  for (let i = 0; i < stationData.length; i++) {
    var station_name = stationData[i].station_nm;
    result[station_name] = {};
    result[station_name]['line_num'] = stationData[i].line_num;
    result[station_name]['time'] = {};
  }

  const edgeData = require("./edges.js");

  for (let i = 0; i < edgeData.length; i++) {
    var station_from = edgeData[i].from;
    var station_to = edgeData[i].to;
    var station_time = edgeData[i].time;
    result[station_from]['time'][station_to] = station_time;
    result[station_to]['time'][station_from] = station_time;
  }

  for (let i in result) {
    if (Object.keys(result[i]['time']).length > 2) {
      result[i]['transfer'] = "true";
    } else {
      result[i]['transfer'] = "false";
    }
  }

  return result;
}


function PriorityQueue() {
  this._nodes = [];

  this.enqueue = function (priority, key) {
    this._nodes.push({
      key: key,
      priority: priority
    });
    this.sort();
  };
  this.dequeue = function () {
    return this._nodes.shift().key;
  };
  this.sort = function () {
    this._nodes.sort(function (a, b) {
      return a.priority - b.priority;
    });
  };
  this.isEmpty = function () {
    return !this._nodes.length;
  };
}


function Graph() {
  var INFINITY = 1 / 0;
  this.vertices = {};

  this.addVertex = function (graph) {
    this.vertices = graph;
  };

  this.shortestPath = function (start, finish) {
    var nodes = new PriorityQueue(),
      distances = {},
      previous = {},
      path = [],
      smallest, vertex, neighbor, alt;

    for (vertex in this.vertices) {
      if (vertex === start) {
        distances[vertex] = 0;
        nodes.enqueue(0, vertex);
      } else {
        distances[vertex] = INFINITY;
        nodes.enqueue(INFINITY, vertex);
      }

      previous[vertex] = null;
    }

    while (!nodes.isEmpty()) {
      smallest = nodes.dequeue();

      if (smallest === finish) {
        path = [];

        while (previous[smallest]) {
          path.push(smallest);
          smallest = previous[smallest];
        }

        break;
      }

      if (!smallest || distances[smallest] === INFINITY) {
        continue;
      }

      for (neighbor in this.vertices[smallest]['time']) {
        alt = distances[smallest] + this.vertices[smallest]['time'][neighbor];

        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = smallest;

          nodes.enqueue(alt, neighbor);
        }
      }
    }

    return path;
  };
}

var g = new Graph();

g.addVertex(makeStation());

function pathTime(path) {
  let station = makeStation();
  var time = 0;
  for (let i = 0; i < path.length - 1; i++) {
    time += station[path[i]]['time'][path[i + 1]];
  }
  return time;
}

console.log(g.shortestPath('인하대', '석바위시장').concat(['인하대']).reverse());
//console.log(makeStation());
console.log(pathTime(g.shortestPath('인하대', '석바위시장').concat(['인하대']).reverse()));