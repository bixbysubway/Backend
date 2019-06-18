const http = require('http');
const fetch = require("node-fetch");

const api = '59726d4b58736b79343548564e7141';
const service = 'SearchSTNTimeTableByIDService';

const stationData = require("./vertices.js");
const edgeData = require("./edges.js");
const graphData = require("./station.js");

function makeStation() {
  //const stationData = require("./vertices.js");
  const result = {};

  for (let i = 0; i < stationData.length; i++) {
    var station_name = stationData[i].station_nm;
    result[station_name] = {};
    result[station_name]['time'] = {};
  }


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
g.addVertex(graphData);

/*
function pathTime(path) {
  let station = stationData;
  var time = 0;
  for (let i = 0; i < path.length - 1; i++) {
    time += station[path[i]]['time'][path[i + 1]];
  }
  return time;
}
*/
/*
var fs = require('fs');
fs.writeFile('./station.js', JSON.stringify(makeStation()), function (err) {
  if (err === null) {
    console.log('success');
  } else {
    console.log('fail');
  }
});
*/


//console.log(g.shortestPath('종로3가', '동대문역사문화공원').concat(['종로3가']).reverse());
//console.log(graphData);
//console.log(pathTime(g.shortestPath('온수', '홍대입구').concat(['온수']).reverse()));

let path = g.shortestPath('선학', '제물포').concat(['선학']).reverse()
console.log(path);
// let url = 'http://openapi.seoul.go.kr:8088/59726d4b58736b79343548564e7141/json/SearchSTNTimeTableByIDService/1/3/1809/1/1/';


// let url = `http://openapi.seoul.go.kr:8088/${api}/json/${service}/1/3/1809/1/1/`;

//let response = http.getUrl(url, {format:"json", returnHeaders:true});

function matchLineBeforeNext(beforeStation, nowStation, nextStation) {
  var beforeLine = new Array;
  var nowLine = new Array;
  var nextLine = new Array;
  for (let i = 0; i < stationData.length; i++) {
    if (stationData[i].station_nm == beforeStation)
      beforeLine.push(stationData[i].line_num);
    if (stationData[i].station_nm == nowStation)
      nowLine.push(stationData[i].line_num);
    if (stationData[i].station_nm == nextStation)
      nextLine.push(stationData[i].line_num);
  }

  for (let i = 0; i < beforeLine.length; i++) {
    for (let j = 0; j < nowLine.length; j++) {
      for (let k = 0; k < nextLine.length; k++) {
        if (beforeLine[i] == nowLine[j] && nowLine[j] == nextLine[k]) {
          return beforeLine[i];
        }
      }
    }
  }
  return false;
}

function matchLineBefore(beforeStation, nowStation) {
  var beforeLine = new Array;
  var nowLine = new Array;
  for (let i = 0; i < stationData.length; i++) {
    if (stationData[i].station_nm == beforeStation)
      beforeLine.push(stationData[i].line_num);
    if (stationData[i].station_nm == nowStation)
      nowLine.push(stationData[i].line_num);
  }

  for (let i = 0; i < beforeLine.length; i++) {
    for (let j = 0; j < nowLine.length; j++) {
      if (beforeLine[i] == nowLine[j])
        return beforeLine[i];
    }
  }
  return false;
}

function splitPath(path) {
  var cpath = path;
  var splitPath = new Array();
  var resultPath = new Array();

  var splitLine = new Array();
  var resultLine = new Array();

  end:
    while (1) {
      for (let i = 0; i <= cpath.length; i++) {
        if (i == cpath.length) {
          resultPath.push(cpath);
          resultLine.push(splitLine);
          break end;
        }
        if (i == 0) {
          split = matchLineBeforeNext(cpath[i], cpath[i + 1], cpath[i + 2]);
          splitB = matchLineBefore(cpath[i], cpath[i + 1]);
          if (cpath.length == 2)
            splitLine.push(splitB);
          else {
            if (split)
              splitLine.push(split);
            else {
              splitLine.push(splitB);
            }
          }
        } else if (i == cpath.length - 1) {
          split = matchLineBeforeNext(cpath[i - 2], cpath[i - 1], cpath[i]);
          splitB = matchLineBefore(cpath[i - 1], cpath[i]);
          if (cpath.length == 2) {
            splitLine.push(splitB);
          } else {
            if (split)
              splitLine.push(split);
            else
              splitLine.push(splitB);
          }
        } else {
          split = matchLineBeforeNext(cpath[i - 1], cpath[i], cpath[i + 1]);
          split_before = matchLineBeforeNext(cpath[i - 2], cpath[i - 1], cpath[i]);
          splitB = matchLineBefore(cpath[i - 1], cpath[i]);
          if (split) {
            splitLine.push(split);
          } else {
            splitPath = cpath.slice(0, i + 1);
            cpath = cpath.slice(i, cpath.length + 1);
            if (i == 1) {
              splitLine.push(splitB);
            } else {
              splitLine.push(split_before);
            }
            resultPath.push(splitPath);
            resultLine.push(splitLine);
            splitLine = [];
            break;
          }
        }
      }
    }
  return {
    resultPath,
    resultLine
  };
}


var date = new Date();
var nowMinTime = Number(date.getHours()) * 60 + Number(date.getMinutes());

function changeTime(time) {
  var minTime = Number(time.substr(0, 2)) * 60 + Number(time.substr(3, 2));
  return minTime;
}

function matchStation(station, line) {
  for (let i = 0; i < stationData.length; i++) {
    if (stationData[i].station_nm == station && stationData[i].line_num == line)
      return stationData[i].station_cd;
  }
  return null;
}

function matchLine(engLine, korLine) {
  switch (engLine) {
    case '1':
      if (korLine == '01호선') return true;
      else return false;
    case '2':
      if (korLine == '02호선') return true;
      else return false;
    case '3':
      if (korLine == '03호선') return true;
      else return false;
    case '4':
      if (korLine == '04호선') return true;
      else return false;
    case '5':
      if (korLine == '05호선') return true;
      else return false;
    case '6':
      if (korLine == '06호선') return true;
      else return false;
    case '7':
      if (korLine == '07호선') return true;
      else return false;
    case '8':
      if (korLine == '08호선') return true;
      else return false;
    case '9':
      if (korLine == '09호선') return true;
      else return false;
    case 'A':
      if (korLine == '공항철도') return true;
      else return false;
    case 'B':
      if (korLine == '분당선') return true;
      else return false;
    case 'E':
      if (korLine == '용인경전철') return true;
      else return false;
    case 'G':
      if (korLine == '경춘선') return true;
      else return false;
    case 'I':
      if (korLine == '인천선') return true;
      else return false;
    case 'I2':
      if (korLine == '인천2호선') return true;
      else return false;
    case 'K':
      if (korLine == '경의선') return true;
      else return false;
    case 'KK':
      if (korLine == '경강선') return true;
      else return false;
    case 'S':
      if (korLine == '신분당선') return true;
      else return false;
    case 'SU':
      if (korLine == '수인선') return true;
      else return false;
    case 'U':
      if (korLine == '의정부경전철') return true;
      else return false;
    case 'UI':
      if (korLine == '우이신설경전철') return true;
      else return false;
  }
}

async function getStationTime(station, day, arrow, nowMinTime, line) {
  let url = `http://openapi.seoul.go.kr:8088/${api}/json/${service}/1/800/${station}/${day}/${arrow}/`;
  const res = await fetch(url);
  const json = await res.json();
  const timeSchedule = json.SearchSTNTimeTableByIDService.row;

  for (let i = 0; i < timeSchedule.length; i++) {
    var arriveTime = changeTime(timeSchedule[i].ARRIVETIME);
    var leftTime = changeTime(timeSchedule[i].LEFTTIME);
    var apiLine = timeSchedule[i].LINE_NUM;

    if (leftTime > nowMinTime && matchLine(line, apiLine) && leftTime != 0) {
      let resultTime = timeSchedule[i].LEFTTIME;
      let resultTrain = timeSchedule[i].TRAIN_NO;
      return {
        resultTime,
        resultTrain
      };
    }
  }
  return null;
}

async function findSameTrain(station, day, arrow, time, train) {
  let url = `http://openapi.seoul.go.kr:8088/${api}/json/${service}/1/800/${station}/${day}/${arrow}/`;
  const res = await fetch(url);
  const json = await res.json();
  const timeSchedule = json.SearchSTNTimeTableByIDService.row;

  for (let i = 0; i < timeSchedule.length; i++) {
    var arriveTime = changeTime(timeSchedule[i].ARRIVETIME);
    if (arriveTime > time && timeSchedule[i].TRAIN_NO == train && arriveTime != 0) {
      resultTime = timeSchedule[i].ARRIVETIME;
      return resultTime;
    }
  }
  return false;
}

async function resultTime(start, end, line, times, j) {
  for (let i = 1; i < 3; i++) {
    var startTime;
    getStationTime(`${start}`, '1', `${i}`, nowMinTime, line)
      .then(res => {
        startTime = res.resultTime;
        console.log(line);
        console.log(startTime);
        return findSameTrain(`${end}`, '1', `${i}`, changeTime(res.resultTime), res.resultTrain)
          .then(endTime => {
            if (endTime != false) {
    //          console.log(startTime);
    //          console.log(endTime);
     //         console.log('\n');
              times[j].push(startTime);
              times[j].push(endTime);
     //         console.log(times);
            }
          });
      });
  }
}



/*
async function resultTime(start, end, line) {
  for (let i = 0; i < 2; i++) {
    const startTime = await getStationTime(`${start}`, '1', `${i}`, nowMinTime, line).resultTime;
      
    const endTime = await findSameTrain(`${end}`, '1', `${i}`, res.resultTime, res.resultTrain);
      console.log(endTime);
      if (endTime != false)
        return {startTime, endTime};
  }
}
*/

let resultPath = splitPath(path).resultPath;
let resultLine = splitPath(path).resultLine;
var times = [[],[],[],[],[]];

function splitTime() {
  var result = new Array();

  for (let i = 0; i < resultLine.length; i++) {
    var startStationCode = matchStation(resultPath[i][0], resultLine[i][0]);
    var endStationCode = matchStation(resultPath[i][resultPath[i].length - 1], resultLine[i][resultLine[i].length - 1]);

    resultTime(startStationCode, endStationCode, resultLine[i][0], times, i);
    //    var endTime = await resultTime(startStationCode, endStationCode, resultLine[i][0]);
    //    console.log(endTime);
    //  times.push(startTime);
    //   times.push(endTime);
   // result.push(times);
  }
  var result = times;
  times = [[],[],[],[],[]];
  setTimeout(() => {console.log(result)}, 2000);
  return result;
}

console.log(splitPath(path));

console.log(splitTime());

