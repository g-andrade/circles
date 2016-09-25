/*jshint multistr: true */
$(document).ready(init);

// from https://gist.github.com/wteuber/6241786
Math.fmod = function (a,b) { return Number((a - (Math.floor(a / b) * b)).toPrecision(8)); };

var TWO_PI = 2 * Math.PI;
var BOARD_CANVAS;
var BOARD_CANVAS_CTX;
var ORIGINAL_PAGE_TITLE;
var LAST_RENDER_TIMESTAMP = Date.now();

function init() {
    ORIGINAL_PAGE_TITLE = document.title;
    BOARD_CANVAS = $("#whiteboard")[0];
    onResize(true);
    $(window).on('resize', onResize);

    initControls();

    setInterval(
            function (e) {
                var currentTimestamp = Date.now();
                var elapsedMilliseconds = currentTimestamp - LAST_RENDER_TIMESTAMP;
                LAST_RENDER_TIMESTAMP = currentTimestamp;
                render(elapsedMilliseconds);
            },
            50);
}

function onResize() {
    var boundingRect = BOARD_CANVAS.getBoundingClientRect();
    BOARD_CANVAS.width = boundingRect.width;
    BOARD_CANVAS.height = boundingRect.height;
    BOARD_CANVAS_CTX = BOARD_CANVAS.getContext("2d", {antialias: true});
    if (BOARD_CANVAS_CTX === undefined)
        window.alert("no webgl support :(");
}

function absDimension(v) {
    return v * Math.min(BOARD_CANVAS.width, BOARD_CANVAS.height);
}

var ARC_PHASES = [];

function render(ellapsedMilliseconds) {
    maybeUpdateUrlParams(ellapsedMilliseconds);
    decayImage(ellapsedMilliseconds);
    var i = 0;
    var numArcs = Number($("#amount")[0].value);
    maybeResizePhases(numArcs);
    var arcWidth = absDimension(Number($("#width")[0].value));
    var arc0Radius = absDimension(Number($("#center")[0].value));
    var arcSpeed = absDimension(Number($("#speed")[0].value));
    var centerX = BOARD_CANVAS.width / 2.0;
    var centerY = BOARD_CANVAS.height / 2.0;
    var ellapsedSeconds = ellapsedMilliseconds / 1.0e3;
    var color = $("#color")[0].value;

    for (i = 0; i < numArcs; i++) {
        var arcRadius = arc0Radius + (arcWidth * i);
        var arcPerimeter = arcRadius * TWO_PI;
        var prevPhase = ARC_PHASES[i];
        var newPhase = Math.fmod(prevPhase + (arcSpeed * ellapsedSeconds * TWO_PI), arcPerimeter);
        ARC_PHASES[i] = newPhase;

        var prevAngle = (prevPhase / arcPerimeter) * TWO_PI;
        var newAngle = (newPhase / arcPerimeter) * TWO_PI;

        BOARD_CANVAS_CTX.beginPath();
        BOARD_CANVAS_CTX.arc(centerX, centerY, arcRadius, prevAngle, newAngle, false);
        BOARD_CANVAS_CTX.lineWidth = arcWidth;
        BOARD_CANVAS_CTX.strokeStyle = color;
        BOARD_CANVAS_CTX.stroke();
    }
}

function decayImage(ellapsedMilliseconds) {
    var transparency = Number($("#decay")[0].value);
    BOARD_CANVAS_CTX.fillStyle = "rgba(255, 255, 255, " + transparency.toString() + ")";
    BOARD_CANVAS_CTX.fillRect(0, 0, BOARD_CANVAS.width, BOARD_CANVAS.height);
}

function setupRangeControl(id, min, max, step, value) {
    var inputElement = $(id)[0];
    inputElement.min = min.toString();
    inputElement.max = max.toString();
    inputElement.step = step.toString();
    inputElement.value = value.toString();
}

function maybeResizePhases(arcCount) {
    if (arcCount != ARC_PHASES.length) {
        var newArcPhases = Array.apply(null, Array(arcCount)).map(Number.prototype.valueOf, 0);
        for (var i = 0; i < Math.min(arcCount, ARC_PHASES.length); i++) {
            newArcPhases[i] = ARC_PHASES[i];
        }
        ARC_PHASES = newArcPhases;
    }
}

var URL_UPDATE_ACCUM = 0;
var LAST_URL_PARAMS = "";

function getUrlParams() {
    return (
        "decay=" + $("#decay")[0].value + "&" +
        "speed=" + $("#speed")[0].value + "&" +
        "width=" + $("#width")[0].value + "&" +
        "amount=" + $("#amount")[0].value + "&" +
        "center=" + $("#center")[0].value + "&" +
        "color=" + $("#color")[0].value);
}

function maybeUpdateUrlParams(ellapsedMilliseconds) {
    URL_UPDATE_ACCUM += ellapsedMilliseconds;
    var urlParams = getUrlParams();
    if (URL_UPDATE_ACCUM > 2000 && (urlParams != LAST_URL_PARAMS)) {
        window.history.pushState(
                'whiteboard',
                ORIGINAL_PAGE_TITLE,
                "#" + urlParams);
        URL_UPDATE_ACCUM = 0;
    }
}

function parseQuery(qstr) {
    // https://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
    var query = {};
    var a = qstr.substr(1).split('&');
    for (var i = 0; i < a.length; i++) {
        var b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
    }
    return query;
}

function initControls() {
    var decay0 = 0.01;
    var speed0 = 0.6;
    var width0 = 0.005;
    var amount0 = 300;
    var center0 = 0.02;
    var color0 = "#C100FF";

    if (window.location.hash) {
        args = parseQuery(window.location.hash);
        decay0 = args.decay || decay0;
        speed0 = args.speed || speed0;
        width0 = args.width || width0;
        amount0 = args.amount || amount0;
        center0 = args.center || center0;
        color0 = args.color || color0;
    }

    setupRangeControl("#decay", 0.0, 0.5, 0.005, decay0);
    setupRangeControl("#speed", 0.0, 1.0, 0.005, speed0);
    setupRangeControl("#width", 0.001, 0.1, 0.0005, width0);
    setupRangeControl("#amount", 0, 1000, 1, amount0);
    setupRangeControl("#center", 0, 0.2, 0.001, center0);
    $("#color")[0].value = color0;
}
