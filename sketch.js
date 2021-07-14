var controls = null;

var sound;
var fourier;
var beatDect;
var spectrum;
var energy;
var amplitude;

var loadingImg;
var backImg;
var backImages = [];
var images = [];
var img;
var imgNum

//the gui control values
var soundControl;

//object to control the main sphere
var controlObj;

var gui;
//newSoundLoaded is the value to control the drawing of loading image when a new sound is updated by the upload button
var newSoundLoaded = false;
var soundOnChange = false;

function preload(){
    //the loading image when uploading a new sound
    loadingImg = loadImage("assets/loading.gif");
    
    //the default sound
    sound = loadSound("assets/Namfon.flac");
    
     //images are from https://unsplash.com/photos/qtRF_RxCAo0
    //backImg = loadImage("assets/b0.jpg");
    for (var i = 0; i <= 5; i++){
        var b = loadImage("assets/b"+i+".jpg");
        backImages.push(b);
    }
    for (var i = 0; i <= 21; i++){
        var s  = loadImage("assets/s"+i+".jpg");
        images.push(s);
    }
}

//the success callback of uploading a sound
function successBack(){
    alert("Sound is Ready !");
    newSoundLoaded = false; 
}

//the error callback of uploading a sound
function errorBack(err){
    alert("can not load the file:  " + err);
    sound = loadSound('assets/Namfon.flac');
    newSoundLoaded = false;
}

//the whileloading callback of uploading a sound
function loading(percent){
    newSoundLoaded = true;
}

function setup(){
    createCanvas(windowWidth, windowHeight, WEBGL);
    background(0);
    fourier = new p5.FFT();
    amplitude = new p5.Amplitude();
    beatDect = new BeatDect();
    
    //the gui object to control the sound
    soundControl = new function(){
        this.Volume = 0.5;
        this.jump = 0;
        this.fullScreen = function(){
            let fs = fullscreen();
            fullscreen(!fs);
        }
        this.uploadSong = function(){
            document.getElementById("audiofile").click();
            document.getElementById("audiofile").onchange = function(event){
                if(event.target.files[0]){
                    if(typeof sound != "undefined"){
                        // Catch already playing songs
                        sound.disconnect();
                        sound.stop();
                        controls.playing = false;
                        controls.draw();
                    }
                    // Load our new song
                    sound = loadSound(URL.createObjectURL(event.target.files[0]),successBack,errorBack,loading);
                    
                }
            }
        }
        this.save = function(){
            saveCanvas("myCanvas", "png")
        }
    }
    gui = new dat.GUI();
    //control the volume of the sound
    gui.add(soundControl,"Volume",0,1);
    //jump the sound to a certain point
    var soundJump = gui.add(soundControl,"jump", 0, sound.duration());
    soundJump.name("Sound Bar");
    soundJump.listen();
    soundJump.onChange(function(){soundOnChange = true});
    soundJump.onFinishChange(function(){
        if(sound.isPlaying() == false){
            sound.jump(soundControl.jump);
            controls.playing = true;
            controls.draw();
        }
        else{
            sound.jump(soundControl.jump);
        }
        
        soundOnChange = false;});
    //full screen
    gui.add(soundControl,"fullScreen").name("Full Screen");
    var newSong = gui.add(soundControl,"uploadSong").name("Upload Sound");
    
    //object the control the main sphere
    controlObj = new function(){
        this.Image = 10;
        this.backImg = 0;
        this.ran = function(){
            this.Image = floor(random(0,16));
            img = images[this.Image];
        }
        this.shape = "Sphere";
        this.size = width/5;
        this.detailX = 24;
        this.detailY = 16;
        this.autoImage = true;
        this.autoShape = true;
        this.rotationSpeed = 1;
    }
    imgNum = images.length;
    gui.add(controlObj,"autoImage").listen();
    gui.add(controlObj,"autoShape").listen();
    gui.add(controlObj, "Image", 0, imgNum-1,1).listen();
    gui.add(controlObj, "backImg", 0, backImages.length-1, 1).name("plane image").listen();
    gui.add(controlObj,"ran").name("Random Image");
    gui.add(controlObj,"shape", ["Sphere","Box", "Cylinder", "Torus"]).listen();
    gui.add(controlObj, "size", controlObj.size/2, displayWidth/2);
    gui.add(controlObj,"detailX",3,24,1).listen();
    gui.add(controlObj,"detailY",3,16,1).listen();
    gui.add(controlObj,"rotationSpeed",0.5,5);
    gui.add(soundControl,"save").name("Save Canvas");
    //create a new visualisation container and add visualisations
    controls = new PlaybackButton();
}

function draw(){
    //change the sound volume and jump to certain point arrcording with the gui
    sound.setVolume(soundControl.Volume);
    if(soundOnChange == false){
        soundControl.jump = sound.currentTime();
    }
    
    //initial variables
    background(0);
    spectrum = fourier.analyze();
    energy = fourier.getEnergy("bass");
    volume = amplitude.getLevel();
    img = images[controlObj.Image];
    backImg = backImages[controlObj.backImg];
    
    //auto change image
    if (controlObj.autoImage == true && beatDect.detectBeat(spectrum)){
        if (random() > 0.9){
            controlObj.Image = floor(random(0,imgNum));
            img = images[controlObj.Image];
        }
        if (frameCount % 120 == 0){
            controlObj.backImg = floor(random(0, backImages.length));
            backImg = backImages[controlObj.backImg];
        }
    }
    
    //auto change shape
    if (controlObj.autoShape == true &&  beatDect.detectBeat(spectrum)){
        if (random() > 0.9){
            var r = floor(random(0,4));
            var s = ["Sphere","Box", "Cylinder", "Torus"];
            if (r == 0){controlObj.shape = s[0]};
            if (r == 1){controlObj.shape = s[1]};
            if (r == 2){controlObj.shape = s[2]};
            if (r == 3){controlObj.shape = s[3]};
        }
    }
    
    //the light control
    ambientLight(255);
    let dirX = (mouseX / width - 0.5) * 2;
    let dirY = (mouseY / height - 0.5) * 2;
    directionalLight(200,200,200, -dirX, -dirY, -1);
    let locX = mouseX - width / 2;
    let locY = mouseY - height / 2;
    pointLight(200,200,200, locX, locY, 100);
    
    //draw the main shape
    var r = map(energy, 0, 250, 0.002,0.01)*controlObj.rotationSpeed;
    push();
    noStroke();
    rotateZ(frameCount * r);
    rotateX(frameCount * r);
    rotateY(frameCount * r);
    ambientLight(random(0,255),random(0,255),random(0,255));
    ambientLight(255);
    texture(img);
    var ran = volume*5;
    translate(ran,ran,ran);
    if(controlObj.shape == "Sphere"){
        sphere(controlObj.size/5+ran*5,controlObj.detailX, controlObj.detailY);
    }
    else if (controlObj.shape == "Box"){
        box(controlObj.size/5+ran*5);
    }
    else if (controlObj.shape == "Torus"){
        torus(controlObj.size/5+ran*5, controlObj.size/10+ran*5,controlObj.detailX, controlObj.detailY);
    }
    else if (controlObj.shape == "Cylinder"){
        cylinder(controlObj.size/5+ran*5, controlObj.size/2+ran*5, controlObj.detailX, controlObj.detailY);
    }  
    pop();
    
    //draw the background plane
    push();
    rotateX(PI/2);
    rotateZ(frameCount * 0.002);
    texture(backImg);
    translate(0,0,-200);
    noStroke();
    plane(width,height);
    pop();
    
    //draw small bolls
    var jNum = map(energy, 0, 250, 1, 10);
    var ballNum = map(energy, 0, 250, 5, 100);
    var r = map(energy, 0, 250, 0.0005, 0.001)*controlObj.rotationSpeed;
    var size = map(energy, 0, 250, 0.5, 1.5);
    //the codes below are adapted from p5 example: https://p5js.org/examples/3d-sine-cosine-in-3d.html
    for (let j = 0; j < jNum; j++) {
        push();
        for (let i = 0; i < ballNum; i++) {
            translate(
            sin(frameCount * r + j) * map(volume, 0, 1, width/5, width),
            sin(frameCount * r + j) * map(volume, 0, 1, height/5, height),
            -i * volume*0.5
            );
            rotateZ(frameCount * 0.002);
            push();
            ambientLight(255);
            noStroke();
            texture(img);
            sphere(floor(4*size), floor(3*size), floor(2*size));
            pop();
        }
        pop()
    }
    
    //while uploading a sound, draw a sound image
    push();
    translate(-width/2, -height/2, 0);
    if(newSoundLoaded){
        image(loadingImg, 0, 0);
    }
    fill(255);
    controls.draw();
    pop();
}

function mouseClicked(){
    controls.hitCheck()
}

function windowResized(){
    resizeCanvas(windowWidth, windowHeight);
    controlObj.size = windowWidth/5;
}