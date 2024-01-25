document.addEventListener("DOMContentLoaded", function () {
    // Variables para la cámara y el micrófono
    let videoElement;
    let audioContext;
    let mediaStream;
    let analyser;
    let gainNode;

    // Acceder al contenedor de la cámara 1
    const camera1 = document.querySelector(".camera-container");

    // Botones y controles
    const stopButton = document.createElement("button");
    const muteButton = document.createElement("button");
    const volumeControl = document.createElement("input");

    // Variable para controlar doble clic
    let doubleClick = false;

    // Tiempo máximo permitido entre clics para considerar un doble clic
    const doubleClickDelay = 300; // en milisegundos
    let clickTime = 0;

    // Botón para detener la transmisión
    stopButton.textContent = "Detener Transmisión";
    stopButton.disabled = true;
    stopButton.addEventListener("click", stopStreaming);

    // Botón para silenciar/desilenciar
    muteButton.textContent = "Silenciar";
    muteButton.addEventListener("click", toggleMute);
    muteButton.disabled = true;

    // Control deslizante para ajustar el volumen
    volumeControl.type = "range";
    volumeControl.min = 0;
    volumeControl.max = 1;
    volumeControl.step = 0.01;
    volumeControl.value = 1;
    volumeControl.addEventListener("input", handleVolumeControl);
    volumeControl.disabled = true;

    // Asignar evento de doble clic al contenedor de la cámara
    camera1.addEventListener("dblclick", function (event) {
        doubleClick = true;
        clickTime = new Date().getTime();
        setTimeout(function () {
            if (new Date().getTime() - clickTime < doubleClickDelay) {
                doubleClick = false;
                toggleFullscreen();
            } else {
                doubleClick = false;
            }
        }, doubleClickDelay);
    });

    // Iniciar la transmisión al hacer doble clic
    camera1.addEventListener("dblclick", startStreaming);

    // Añadir botones y controles al contenedor
    camera1.appendChild(stopButton);
    camera1.appendChild(muteButton);
    camera1.appendChild(volumeControl);

    // Función para iniciar la transmisión de cámara y micrófono
    function startStreaming() {
        if (!doubleClick) {
            return;
        }

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(function (stream) {
                mediaStream = stream;

                // Crear el elemento de video para transmitir la cámara del usuario
                videoElement = document.createElement("video");
                videoElement.autoplay = true;
                videoElement.srcObject = stream;
                videoElement.style.width = "100%"; // Ajuste al tamaño del contenedor
                videoElement.style.height = "100%"; // Ajuste al tamaño del contenedor
                camera1.appendChild(videoElement);

                // Configurar el contexto de audio
                audioContext = new AudioContext();
                const microphone = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                gainNode = audioContext.createGain();

                // Conectar la entrada del micrófono al nodo de ganancia
                microphone.connect(gainNode);

                // Conectar la ganancia al analizador y luego a la salida de audio
                gainNode.connect(analyser);
                analyser.connect(audioContext.destination);

                // Realizar acciones para el doble clic
                stopButton.disabled = false;
                muteButton.disabled = false;
                volumeControl.disabled = false;
            })
            .catch(function (error) {
                console.error("Error al acceder a la cámara y al micrófono: ", error);
            });
    }

    // Función para detener la transmisión de cámara y micrófono
    function stopStreaming() {
        if (mediaStream) {
            // Detener la transmisión de cámara y micrófono
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;

            // Detener el contexto de audio
            if (audioContext) {
                audioContext.close();
                audioContext = null;
            }

            // Eliminar el elemento de video
            if (videoElement) {
                camera1.removeChild(videoElement);
                videoElement = null;
            }

            // Botones deshabilitados
            stopButton.disabled = true;
            muteButton.disabled = true;
            volumeControl.disabled = true;
        }
    }

    // Función para silenciar/desilenciar
    function toggleMute() {
        if (audioContext && gainNode) {
            // Si está silenciado, establecer ganancia a 0; de lo contrario, restaurar a 1
            if (muteButton.textContent === "Silenciar") {
                gainNode.gain.value = 0;
                muteButton.textContent = "Desilenciar";
            } else {
                gainNode.gain.value = 1;
                muteButton.textContent = "Silenciar";
            }
        }
    }

    // Función para ajustar el volumen deslizando verticalmente
    function handleVolumeControl(event) {
        const touchY = event.touches[0].clientY;
        const elementHeight = videoElement.clientHeight;
        const volume = 1 - (touchY / elementHeight); // Invertir ya que el origen está en la parte superior

        if (audioContext && gainNode) {
            gainNode.gain.value = volume;
        }
    }

    // Mostrar el video en pantalla completa al hacer doble clic
    function toggleFullscreen() {
        if (videoElement) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoElement.requestFullscreen();
            }
        }
    }
});

