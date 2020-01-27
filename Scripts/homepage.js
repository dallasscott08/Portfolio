﻿var ctx, hCtx, canvasWidth, canvasHeight, sixtyTimer, thirtyTimer, starCount, scrollSpy, centerCircle;
var fadeIncrement = .02;
var sixtyFPS = 1000 / 60;
var thirtyFPS = 1000 / 240;
var maxRadius = 1.5;
var maxGlow = 1;
var circleCountMultiplier = .001;
var circleGlowSkip = 2;
var circles = [];
var colors = ["#bb52a7", "#e6c0e1", "#5c628c", "#33B5E5", "#FFFFFF", "#FF3C1E", "#FFFF31"];//["#1790DA", "#EADB46", "#D42825", "white", "white"];
var scrollInterval = 40;
var angleIncrement = .3;
var angleAnimationSpeed = .1;
var circlePercent = 0;
var circlePercentIncrement = .2;
var sections = []

function Circle(x,y,r) {
    this.xPos = x;
    this.yPos = y;
    this.radius = r;
    this.leftAngle = 0;
    this.rightAngle = 2;
    this.anticlockwise = false;
    this.alpha = 1;
    this.color;
    this.isFading = false;
}

Circle.prototype = {
    draw: function(){
        ctx.beginPath();
        ctx.globalCompositeOperation = 'source-over'
        ctx.arc(this.xPos, this.yPos, this.radius, this.leftAngle * Math.PI, this.rightAngle * Math.PI, this.anticlockwise);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
    },
    clear: function (context) {
        context.beginPath();        
        context.globalCompositeOperation = 'destination-out'
        context.arc(this.xPos, this.yPos, this.radius + 2, 0, 2 * Math.PI, this.anticlockwise);
        context.fill();
    }
}

function CenterCircle(x,y,r) {
    Circle.call(this, x,y,r);
    this.animationLeftAngle = 1.5;
    this.animationRightAngle = 1.5;
    this.firstDraw = true;
    this.fullyDrawn = false;
    this.inViewport = true;
}

CenterCircle.prototype = Object.create(Circle.prototype);
CenterCircle.prototype.constructor = CenterCircle;
CenterCircle.prototype.draw = function () {
    hCtx.beginPath();
    hCtx.globalCompositeOperation = 'source-over'
    hCtx.arc(this.xPos, this.yPos, this.radius, this.animationLeftAngle * Math.PI, this.animationRightAngle * Math.PI, this.anticlockwise);
    hCtx.strokeStyle = this.color;
    hCtx.globalAlpha = this.alpha;
    hCtx.stroke();
}

CenterCircle.prototype.drawFull = function () {
    hCtx.beginPath();
    hCtx.globalCompositeOperation = 'source-over'
    hCtx.arc(this.xPos, this.yPos, this.radius, 0, 2 * Math.PI, this.anticlockwise);
    hCtx.strokeStyle = this.color;
    hCtx.globalAlpha = this.alpha;
    hCtx.stroke();
}

function Timer() {
    this.last = null;
    this.elapsed = 0;
}

Timer.prototype = {
    tick: function (now) {
        this.last = this.last || now
        this.elapsed = now - this.last
    }
}

function ScrollMonitor() {
    this.last = null;
    this.distance = 0;   
    this.scrollPosition = window.scrollY;
    this.scrollTimeout = null;
}
 
ScrollMonitor.prototype = {
    tick: function () {
        this.last = this.last || window.scrollY
        this.distance = Math.abs(window.scrollY - this.last);
        this.scrollPosition = window.scrollY;
    }
}

function fadeCircles() {
    for (let c = 1; c < circles.length; c++) {
        let circle = circles[c];
        circle.clear(ctx);
        if(circle.alpha >= maxGlow) {
            circle.isFading = true;
        }
        else if(circle.alpha <= fadeIncrement) {
            circle.isFading = false;
        }

        if(!circle.isFading) {
            circle.alpha += fadeIncrement;
        }
        else {
            circle.alpha -= fadeIncrement;
        }
        circle.draw();
    }
}

function createCenterCircle() {
    let centerCircle = circles[0];
    centerCircle.clear(hCtx);
    centerCircle.animationLeftAngle -= .05;
    centerCircle.animationRightAngle += .05;
    centerCircle.draw();
}

function stepCenterCircle() {    
    centerCircle.clear(hCtx);

    if(centerCircle.animationLeftAngle < centerCircle.leftAngle) {
        centerCircle.animationLeftAngle += angleAnimationSpeed;
    }
    else if(centerCircle.animationLeftAngle > centerCircle.leftAngle){
        centerCircle.animationLeftAngle -= angleAnimationSpeed;
    }

    if(centerCircle.animationLeftAngle < .5) {
        centerCircle.animationLeftAngle = .5;
    }
    else if(centerCircle.animationLeftAngle > 1.5) {
        centerCircle.animationLeftAngle = 1.5;
    }

    if(centerCircle.animationLeftAngle >= 1) {
        centerCircle.animationRightAngle = 3 - centerCircle.animationLeftAngle;
    }
    else {
        centerCircle.animationRightAngle = 1 - centerCircle.animationLeftAngle;
    } 

    centerCircle.draw();
}

function animateCenterCircle() {
    if (centerCircle.inViewport){
        if(centerCircle.firstDraw) {
            createCenterCircle();
            if(centerCircle.animationLeftAngle <= .5){
                centerCircle.firstDraw = false;
                centerCircle.fullyDrawn = true;
                correctCenterCircle();
            }
        }
        else if(window.scrollY === 0 && !centerCircle.fullyDrawn) {
            centerCircle.clear(hCtx);
            centerCircle.drawFull();
            centerCircle.fullyDrawn = true;
            correctCenterCircle();
        }
        else if(!centerCircle.fullyDrawn && !similarNumbers(centerCircle.animationLeftAngle, centerCircle.leftAngle, 2, .03)) {
            stepCenterCircle();
        }
    }  
    else if(!centerCircle.fullyDrawn) {
        centerCircle.clear(hCtx);
        correctCenterCircle();
    }
}

function render(now) {
    requestAnimFrame(render);
    sixtyTimer.tick(now);
    thirtyTimer.tick(now);
    if (sixtyTimer.elapsed >= sixtyFPS && fadeIncrement > 0) {
        let then = sixtyTimer.elapsed % sixtyFPS;
        sixtyTimer.last = now - then;
        
        fadeCircles();
        fadeIncrement -= .00001;
    }
    if (thirtyTimer.elapsed >= thirtyFPS) {
        let then = thirtyTimer.elapsed % thirtyFPS;
        thirtyTimer.last = now - then;
        
        animateCenterCircle();
    }
}

function checkOverlap(circle) {
    for(let c = 0; c < circles.length; c++) {
        let x = circle.xPos - circles[c].xPos;
        let y = circle.yPos - circles[c].yPos;
        let d = (circle.radius||0) + circles[c].radius;
        if(x * x + y * y <= d * d * 1.25) { return true; }
    }
    return false;
}

function getRandomColor(color) {
    var p = 1,
        newColor,
        random = Math.random(),
        result = '#';

    while (p < color.length) {
        newColor = parseInt(color.slice(p, p += 2), 16)
        newColor += Math.floor((255 - newColor) * random);
        result += newColor.toString(16).padStart(2, '0');
    }
    return result;
}

function generateCircle(){
    let xPos = Math.floor(Math.random() * canvasWidth);
    let yPos = Math.floor(Math.random() * canvasHeight);
    let radius = Math.random() * maxRadius;//Math.floor(Math.random() * maxRadius);
    let circle = new Circle(xPos, yPos, radius);
    if(checkOverlap(circle)){ 
        return generateCircle(); 
    }
    else{ return circle; }
}

function drawCircles() {
    for(let i = 0;i < starCount; i++) {
        let circle = generateCircle();
        //circle.color = colors[Math.floor(Math.random() * colors.length)];
        circle.color = getRandomColor(colors[Math.floor(Math.random() * colors.length)]);
        circle.alpha = Math.random();
        circle.draw();
        circles.push(circle);
    }
}

function createCanvas() {
    let hCanvas = document.getElementById("homeCanvas");
    hCanvas.width = hCanvas.clientWidth;
    hCanvas.height = hCanvas.clientHeight;
    hCtx = hCanvas.getContext("2d");

    let canvas = document.getElementById("bgCanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx = canvas.getContext("2d");

    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
}

function calculateCircleCount() {
    let canvasArea = canvasHeight * canvasWidth;
    starCount = circleCountMultiplier * canvasArea;
}

function drawCenterCircle() {
    let xPos = window.innerWidth / 2;
    let yPos = window.innerHeight / 2;
    let radius = window.innerHeight / 4;
    centerCircle = new CenterCircle(xPos, yPos, radius);
    centerCircle.color = "#F5ECDA";
    centerCircle.alpha = 1;
    centerCircle.fullyDrawn = false;
    centerCircle.leftAngle = .5;
    circles.push(centerCircle);
}

function setTooltips() {
    $("#home-dot").tooltipster({
       side: "left",
       theme: ["tooltipster-punk", "tooltipster-punk-custom-box", "tooltipster-punk-custom-arrow"
       , "tooltipster-punk-custom-content", "tooltipster-punk-home"]
   });
   $("#about-dot").tooltipster({
       side: "left",
       theme: ["tooltipster-punk", "tooltipster-punk-custom-box", "tooltipster-punk-custom-arrow"
       , "tooltipster-punk-custom-content", "tooltipster-punk-about"]
   });
   $("#resume-dot").tooltipster({
       side: "left",
       theme: ["tooltipster-punk", "tooltipster-punk-custom-box", "tooltipster-punk-custom-arrow"
       , "tooltipster-punk-custom-content", "tooltipster-punk-resume"]
   });
   $("#projects-dot").tooltipster({
       side: "left",
       theme: ["tooltipster-punk", "tooltipster-punk-custom-box", "tooltipster-punk-custom-arrow"
       , "tooltipster-punk-custom-content", "tooltipster-punk-projects"]
   });
}

function checkViewportVisibility(element, fullyInView) {
    var pageTop = $(window).scrollTop();
    var pageBottom = pageTop + $(window).height();
    var elementTop = $(element).offset().top;//$(element).offset().top + (centerCircle.yPos - centerCircle.radius);//
    var elementBottom = elementTop + $(element).height();//elementTop + (centerCircle.radius * 2);//

    if (fullyInView === true) {
        return ((pageTop < elementTop) && (pageBottom > elementBottom));
    } else {
        return ((elementTop <= pageBottom) && (elementBottom >= pageTop));
    }
}

function percentScrolled(element) {
    //return $(window).scrollTop() / $(element).height();
    return $(window).scrollTop() / (centerCircle.radius * 2);
}

function updateCenterCirclePercent() {
    if(scrollSpy.scrollPosition > scrollSpy.last) {
        //scroll down
        if(circlePercent + circlePercentIncrement < 1) {
            circlePercent += circlePercentIncrement;
        }
        else {
            circlePercent = 1;
        }
    }
    else if(scrollSpy.scrollPosition < scrollSpy.last) {
        //scroll up
        if(circlePercent - circlePercentIncrement > 0 ) {
            circlePercent -= circlePercentIncrement;
        }
        else {
            circlePercent = 0;
        }
    }
 
    return truncateDecimals(circlePercent, 2);
 }

function determineSagitta(r, percent) {
    return percent > .5 ? (r * 2) * (1 - percent) : (r * 2) * percent;
}

function determineChordLengthFromSagitta(r, s) {
    return Math.sqrt((2 * s * r) - Math.pow(s, 2));
}

function determineChordIntersection(cx, cy, chordLength, radius, sagitta, belowCenter){
    return {
        x: cx - chordLength,
        y: belowCenter ? cy + (radius - sagitta) : cy - (radius - sagitta)
    };
}

function determineCircleAngle(x, y, cx, cy) {
    return Math.atan2(y - cy, x - cx);
}

function truncateDecimals(num, decimals) {
    return parseFloat(num.toFixed(decimals));
}

function similarNumbers(num1, num2, fractionPartThreshold, distanceThreshold) {
    let trunc1 = truncateDecimals(num1, fractionPartThreshold);
    let trunc2 = truncateDecimals(num2, fractionPartThreshold);

    return trunc2 < trunc1 + distanceThreshold && trunc2 > trunc1 - distanceThreshold;
}

window.onload = (function() {
    createCanvas();
    calculateCircleCount();
    drawCenterCircle();
    drawCircles();
    sixtyTimer = new Timer();
    thirtyTimer = new Timer();
    scrollSpy = new ScrollMonitor();
    $("#top-nav").animate({opacity: 1.0, top: ".15%"}, 300);
    setTooltips();
    createSectionArray();
    requestAnimFrame(render);
});

function createSectionArray(){
    let angleSectionCount = 1 / angleIncrement;
    for(let i = 1; i <= angleSectionCount; i++) {
        sections.push(i * angleIncrement);
    }
}

function tieAngleToVisbilityPercent(percent) {
    for(var i = 0; i < sections.length; i++){
        if(percent < sections[i]){
            return sections[i];
        }
    }
    return sections[sections.length - 1];
}

function updateLeftAngle() {
    var scrollPercent = tieAngleToVisbilityPercent(percentScrolled("#homeCanvas"));//updateCenterCirclePercent();//percentScrolled("#homeCanvas");
    var sagitta = determineSagitta(centerCircle.radius, scrollPercent);
    var chordLength = determineChordLengthFromSagitta(centerCircle.radius, sagitta);
    var chordIntersection = determineChordIntersection(centerCircle.xPos, centerCircle.yPos, chordLength, centerCircle.radius, sagitta, scrollPercent > .5)
    var angle = determineCircleAngle(chordIntersection.x, chordIntersection.y, centerCircle.xPos, centerCircle.yPos);
    if (angle < 0) {
        angle += (2 * Math.PI);
    }
    centerCircle.leftAngle = angle / Math.PI;
    console.log(chordIntersection);
}

function correctCenterCircle() {
    if(!centerCircle.inViewport) {
        centerCircle.leftAngle = .5;
        centerCircle.animationLeftAngle = .5;
        circlePercent = 1;
    }
    else if(!centerCircle.firstDraw && window.scrollY === 0) {
        centerCircle.leftAngle = 1.5;
        centerCircle.anticlockwise = true;
        centerCircle.animationLeftAngle = 1.5;
        circlePercent = 0;
    }
 }

function updateRightAngle() {
    if(centerCircle.leftAngle >= 1) {
        centerCircle.rightAngle = 3 - centerCircle.leftAngle;
    }
    else {
        centerCircle.rightAngle = 1 - centerCircle.leftAngle;
    }    
}

function updateArc() { 
    updateLeftAngle();
    updateRightAngle();
}

window.addEventListener('scroll', function(e) {
    if(scrollSpy.scrollTimeout !== null) {
        window.clearTimeout(scrollSpy.scrollTimeout);
        scrollSpy.tick();
        
        centerCircle.inViewport = checkViewportVisibility("#homeCanvas");
        correctCenterCircle();

        if (centerCircle.inViewport && scrollSpy.distance >= scrollInterval) {
            updateArc();
            let posThen = scrollSpy.distance % scrollInterval;
            scrollSpy.last = scrollSpy.scrollPosition - posThen;
            centerCircle.fullyDrawn = false;
        }
    }
    scrollSpy.scrollTimeout = setTimeout(function() {
        scrollSpy = new ScrollMonitor();
    }, 150);
});

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();