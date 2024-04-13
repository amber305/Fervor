const video = document.getElementById("video");
const toggleWebcamBtn = document.getElementById("toggleWebcamBtn");
let webcamStream = null;
let isWebcamOn = false;

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    faceapi.nets.ageGenderNet.loadFromUri("/models"),
]).then(() => {
    toggleWebcamBtn.addEventListener("click", toggleWebcam);
});

function toggleWebcam() {
    if (isWebcamOn) {
        stopWebcam();
        toggleWebcamBtn.textContent = "Turn On Webcam";
    } else {
        startWebcam();
        toggleWebcamBtn.textContent = "Turn Off Webcam";
    }
    isWebcamOn = !isWebcamOn;
}

function startWebcam() {
    if (!webcamStream) {
        navigator.mediaDevices
            .getUserMedia({
                video: true,
                audio: false,
            })
            .then((stream) => {
                video.srcObject = stream;
                webcamStream = stream;
            })
            .catch((error) => {
                console.log(error);
            });
    }
}

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach((track) => {
            track.stop();
        });
        video.srcObject = null;
        webcamStream = null;
    }
}
// Rest of your face detection code remains the same


video.addEventListener("play", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    faceapi.matchDimensions(canvas, { height: video.height, width: video.width });

    setInterval(async () => {
        if (!isWebcamOn) return;

        const detection = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions().withAgeAndGender();
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        const resizedWindow = faceapi.resizeResults(detection, {
            height: video.height,
            width: video.width,
        });

        faceapi.draw.drawDetections(canvas, resizedWindow);
        faceapi.draw.drawFaceLandmarks(canvas, resizedWindow);
        faceapi.draw.drawFaceExpressions(canvas, resizedWindow);

        resizedWindow.forEach((detection) => {
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: Math.round(detection.age) + " year old " + detection.gender,
            });
            drawBox.draw(canvas);
        });

        console.log(detection);
    }, 100);
});
