const http = require('http');
const fetch = require("node-fetch");

let url = 'http://openapi.seoul.go.kr:8088/59726d4b58736b79343548564e7141/json/SearchSTNTimeTableByIDService/1/10/3128/1/1/';

//let response = http.getUrl(url, {format:"json", returnHeaders:true});

fetch(url)
  .then(res => res.json())
  .then(json => console.log(json));

/*
fetch(url)
    .then((res) => {
        return res.json(); //Promise 반환
    })
    .then((json) => {
        console.log(json); // 서버에서 주는 json데이터가 출력 됨
    });
*/