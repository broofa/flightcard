"use strict";
exports.__esModule = true;
// import another component
var react_1 = require("react");
var react_dom_1 = require("react-dom");
require("bootstrap/dist/css/bootstrap.css");
var react_router_dom_1 = require("react-router-dom");
var App_1 = require("./components/App");
react_dom_1["default"].render(<react_router_dom_1.BrowserRouter><App_1["default"] /></react_router_dom_1.BrowserRouter>, document.querySelector('#content'));
