//the code of BeatDect below comes from https://www.coursera.org/learn/uol-introduction-to-programming-2/lecture/4Ffqs/7-203-extending-the-music-visualiser-firework-beats-part-2
function BeatDect(){
    var sampleBuffer = [];
    this.detectBeat = function(spectrum){
        var sum = 0;
        var isBeat = false;
        for (var i = 0; i < spectrum.length; i++){
            sum += spectrum[i]*spectrum[i];
        }
        if(sampleBuffer.length == 60){
            //detect beat
            //caculate the average of the before 60 sampleBuffers
            var sampleSum = 0;
            for(var i = 0; i < sampleBuffer.length; i++){
                sampleSum += sampleBuffer[i];
            }
            var sampleAverage = sampleSum / sampleBuffer.length;
            //caculate a better c
            //add all variance between the before sampleBuffer and the average; average the variances;
            var varianceSum = 0;
            for (var i = 0; i < sampleBuffer.length; i++){
                varianceSum += sampleBuffer[i]-sampleAverage;
            }
            var variance = varianceSum/sampleBuffer.length;
            var m = -0.15 / (25-200);
            var b = 1 + (m*200);
            var c = (m*variance)+b;
            //if sum is more than the sampleAverage before
            if (sum > sampleAverage*c){
                //beat
                isBeat = true;
            }
            // delete one sampleBuffer and add the current one
            sampleBuffer.splice(0,1);
            sampleBuffer.push(sum);
        }
        else{
            sampleBuffer.push(sum);
        }
        return isBeat;
    };  
}