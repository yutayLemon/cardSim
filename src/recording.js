function initRecorder(renderer){
    const canvasElm = renderer.domElement;
    const videoDownload = document.getElementById("video-download");

    let stream;
    let canvasRecord;
    let url;
    const recordChunks = [];

    document.getElementById('video-start').addEventListener("click",()=>{
            console.log("video:starting");
            stream = canvasElm.captureStream(30);
            canvasRecord = new MediaRecorder(stream,{mimeType:'video/webm'});

            URL.revokeObjectURL(url);
            recordChunks.length = 0;

            canvasRecord.ondataavailable = (event)=>{
            if(event.data && event.data.size > 0){
                recordChunks.push(event.data);
            }
        };

        videoDownload.textContent = "setup...";
        videoDownload.removeAttribute("download");
        
        canvasRecord.onstart = ()=>{
            console.log("video:startRecording");
            videoDownload.textContent = "recording...";
        }
        canvasRecord.onstop = ()=>{
            console.log("video:recroding stoped");
            const blob = new Blob(recordChunks,{type:'video/webm'});
            url = URL.createObjectURL(blob);
            console.log(url);
            videoDownload.href = url;
            videoDownload.download = "threejs-recording.webm";
            videoDownload.textContent = "downloadVid";

            stream.getTracks().forEach((track)=>{
              if(track){
                   track.stop()
                }});
            stream = null;
        }
        canvasRecord.start();
    });

    document.getElementById('video-stop').addEventListener('click',()=>{
        canvasRecord.stop();
    });

    console.log("video recorder init");
}


export {initRecorder}