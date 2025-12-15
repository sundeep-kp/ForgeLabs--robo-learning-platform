import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; 
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; 
import './style.css';

console.log("PLAYGROUND Initializing...");

const container = document.getElementById('threejs-container');
// Manual pivot offset for servo horn (TWEAK THESE!!)
const PIVOT_OFFSET = new THREE.Vector3(-10, 0, 0);
// Explanation:
// x moves the pivot left/right
// y moves the pivot up/down
// z moves pivot forward/back

// --- GLOBAL VARIABLES ---
let servoModel = null;
let pwmPlane = null; 
let pwmTexture = null; 
let currentAngle = 90; // Default center angle

let sensorModel = null;
let distanceReading = 50; // Default distance in cm
let pulseVisualizerLine = null; 

let arduinoLEDMesh = null;
let currentBlinkFrequency = 1.0; 

let currentTarget = null; // Used for smooth camera focusing
let capacitorModel = null;
let currentCapacitorState = 0; 
let chargingSpeed = 0.5; 

let piModel = null;
let uartData = "0x4849"; 
let uartLine = null; 
let sensorCanvasTexture = null;
let sensorPlotPlane = null;
let soundWaveMesh = null; // The mesh representing the travelling pulse
let pulseState = 'IDLE'; // States: 'IDLE', 'TRANSMIT', 'RECEIVE'
let pulseStartTime = 0; // Time when the pulse left the transmitter
const SOUND_VELOCITY_SCALED = 7; // Scaled units per second (constant velocity for visual clarity)
let continuousPulseActive = false; // Flag for continuous loop
let wallMesh = null; // Make the wall mesh globally accessible

const sensorDataHistory = []; // Stores recent distance readings
const MAX_HISTORY_POINTS = 100;
const componentMap = {}; // Stores references to all loaded models by ID

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let scene, camera, renderer, controls;
let uartBitBuffer = [];   // Array of 0s and 1s to be transmitted
let bitIndex = 0;         // Current bit being sent
let lastBitTime = 0;      // Timestamp for controlling bit timing
const bitDuration = 0.1;  // Duration (in seconds) for each bit (approx 10 Baud visually)
let servoShaft = null; // Servo Shaft reference
let servoShaftGeometry = null;
// --- INITIALIZATION ---
if (container) {
    initScene();
    loadComponents();
    animate();
    attachEventListeners();
    
    document.getElementById('component-info').textContent = "Scene loaded. Click on a component to control it.";

} else {
    console.error("CRITICAL ERROR: The element with ID 'threejs-container' was not found in the HTML.");
}

// ---------------------------------------------
// --- SCENE SETUP FUNCTIONS ---
// ---------------------------------------------

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2c3e50);

    // Optimized for container size and responsivity
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(2, 2, 4); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Add pixel ratio for quality
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0); 
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);
}

function loadComponents() {
    const loader = new GLTFLoader();

    // 1. Load Servo Model (Main Body)
    // src/playground.js (Replacement for the entire Servo loading block within loadComponents)

    // 1. Load Servo Model (Main Body)
    loader.load(
        '/models/servo.glb', 
        function (gltf) {
            servoModel = gltf.scene;
            servoModel.position.set(0, -0.5, 0); 
            servoModel.userData = { componentId: 'servo-motor', type: 'actuator' };
            servoModel.scale.set(0.05, 0.05, 0.05);
            scene.add(servoModel);
            
            componentMap['servo-motor'] = servoModel;
            initPWMVisualization();
            
            // Apply initial PWM draw here
            drawPWM(currentAngle); 
            console.log("Servo model loaded and initialized.");

            // --- CRITICAL FIX: LOAD SHAFT SYNCHRONOUSLY HERE ---
            // --- REPLACEMENT: loader.load('/models/Shaft.glb', ...) ---
loader.load(
    '/models/Shaft.glb',
    function (gltfShaft) {

        // 1. Create the pivot object
        servoShaft = new THREE.Group();

        // 2. Load horn geometry
        servoShaftGeometry = gltfShaft.scene;
        servoShaftGeometry.scale.set(0.5, 0.5, 0.5);

        // 3. Add geometry under pivot
        servoShaft.add(servoShaftGeometry);

        // 4. Apply YOUR pivot offsets (finally under your control)
        servoShaftGeometry.position.set(
            PIVOT_OFFSET.x,
            PIVOT_OFFSET.y,
            PIVOT_OFFSET.z
        );

        // 5. Manually position the pivot on top of the servo body
        // (you can tweak these numbers too — but they stay independent)
        servoShaft.position.set(2.6, 3, 1);

        // 6. Rotate around Z (correct axis)
        servoShaft.rotation.z = THREE.MathUtils.degToRad(currentAngle);
        servoShaft.rotation.x= Math.PI/2; // Adjust if needed based on model orientation
        servoShaft.scale.set(1.3, 1.3, 1.3);
        // 7. Drop the horn on the servo
        servoModel.add(servoShaft);

        console.log("Servo Shaft loaded with user-controlled pivot.");
    }
);


// --- REPLACEMENT: updateServo(angle) small fix ---
// Replace the rotation assignment inside updateServo from rotation.y -> rotation.z
function updateServo(angle) {
  currentAngle = angle;
  const rotationRadians = THREE.MathUtils.degToRad(angle);

  if (servoShaft) {
    // Rotate around z after we've centered the geometry. This prevents orbiting.
    servoShaft.rotation.z = rotationRadians;
  }

  drawPWM(angle);
}

            // --- END CRITICAL FIX ---
        }, // <-- Servo.glb success function ends here.
        undefined,
        function (error) {
            console.error('An error occurred loading the Servo model:', error);
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xaa0000 });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, -0.5, 0);
            cube.userData = { componentId: 'servo-motor', type: 'actuator' };
            scene.add(cube);
            componentMap['servo-motor'] = cube;
            initPWMVisualization();
            drawPWM(currentAngle);
        }
    );
    // ... (rest of loadComponents continues)
    // 2. Load Arduino Uno Model
    loader.load(
        '/models/arduino_uno.glb', 
        function (gltf) {
            const arduinoModel = gltf.scene;
            arduinoModel.position.set(4, -0.5, 0); 
            arduinoModel.rotation.y = Math.PI / 4; 
            arduinoModel.scale.set(1.5, 1.5, 1.5);
            arduinoModel.userData = { componentId: 'arduino-uno', type: 'microcontroller' };
            scene.add(arduinoModel);
            componentMap['arduino-uno'] = arduinoModel;

            // --- DEBUG FIX: Create a simulated LED cube ---
            const ledGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
            const ledMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x000000 });
            arduinoLEDMesh = new THREE.Mesh(ledGeometry, ledMaterial);
            arduinoLEDMesh.position.set(0.7, 0.3, 0.3); // Relative to Arduino model
            arduinoModel.add(arduinoLEDMesh); 
            console.log("Arduino model loaded and LED visualization initialized.");
        },
        undefined, 
        function (error) {
            console.error('An error occurred loading the Arduino model:', error);
        }
    );
    
    // 3. Load Capacitor Model
    loader.load(
        '/models/capacitor.glb', 
        function (gltf) {
            capacitorModel = gltf.scene;
            capacitorModel.position.set(-2, -0.5, 0);
            capacitorModel.userData = { componentId: 'capacitor', type: 'passive' };
            scene.add(capacitorModel);
            componentMap['capacitor'] = capacitorModel;
            console.log("Capacitor model loaded.");
        },
        undefined, 
        function (error) {
            console.error('An error occurred loading the Capacitor model:', error);
        }
    );

    // 4. Load Ultrasonic Sensor Model (SYNTAX FIXED & WALL CREATION MOVED)
    loader.load(
        '/models/ultrasonic_sensor.glb', 
        function (gltf) {
            sensorModel = gltf.scene;
            sensorModel.position.set(-4, -0.5, 0);
            sensorModel.userData = { componentId: 'ultrasonic-sensor', type: 'sensor' };
            sensorModel.rotation.y = Math.PI ;
            scene.add(sensorModel);
            componentMap['ultrasonic-sensor'] = sensorModel;
            
            // Initialization functions for the sensor must run AFTER the model is loaded
            initPulseVisualization();
            initAnalogPlot();
            console.log("Ultrasonic Sensor model loaded.");
            
            // Wall Mesh creation (CRITICAL FIX: Placed inside loader success function)
            const wallGeometry = new THREE.PlaneGeometry(3, 3);
            const wallMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x555555, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5
            });
            wallMesh = new THREE.Mesh(wallGeometry, wallMaterial); 
            wallMesh.position.set(-4, 1, -2); // Initial position
            wallMesh.userData = { componentId: 'wall', type: 'boundary' };
            scene.add(wallMesh);
        },
        undefined, 
        function (error) {
            console.error('An error occurred loading the Ultrasonic Sensor model:', error);
        }
    );

    // 5. Load Raspberry Pi Model
    loader.load(
        // NOTE: Path likely needs to be corrected to 'raspberry_pi.glb' if the file name is correct.
        '/models/rasperry_pi.glb', 
        function (gltf) {
            piModel = gltf.scene;
            piModel.position.set(10, -0.5, 3); 
            
            // --- ROTATION FIX ---
            piModel.rotation.y = -Math.PI ; 
            piModel.rotation.x = -Math.PI/2;
            piModel.rotation.z = Math.PI ;
            // --- END ROTATION FIX ---
            
            piModel.scale.set(0.1, 0.1, 0.1);
            piModel.userData = { componentId: 'raspberry-pi', type: 'microcomputer' };
            scene.add(piModel);
            componentMap['raspberry-pi'] = piModel;
            
            initUARTVisualization();
            
            console.log("Raspberry Pi model loaded.");
        },
        undefined, 
        function (error) {
            console.error('An error occurred loading the Raspberry Pi model:', error);
        }
    );
}

// ---------------------------------------------
// --- VISUALIZATION INITIALIZATION ---
// ---------------------------------------------

function initPWMVisualization() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    pwmTexture = new THREE.CanvasTexture(canvas);
    
    const geometry = new THREE.PlaneGeometry(3, 1.5); 
    const material = new THREE.MeshBasicMaterial({ 
        map: pwmTexture, 
        side: THREE.DoubleSide,
        transparent: true 
    });
    
    pwmPlane = new THREE.Mesh(geometry, material);
    pwmPlane.position.set(0, 2.5, 0); 
    pwmPlane.rotation.x = -Math.PI / 4; 
    scene.add(pwmPlane);
}

function initAnalogPlot() {
    // Create canvas for the 2D plot
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    sensorCanvasTexture = new THREE.CanvasTexture(canvas);
    
    // Create the 3D plane to hold the canvas texture
    const geometry = new THREE.PlaneGeometry(3, 1.5); 
    const material = new THREE.MeshBasicMaterial({ 
        map: sensorCanvasTexture, 
        side: THREE.DoubleSide,
        transparent: true 
    });
    
    sensorPlotPlane = new THREE.Mesh(geometry, material);
    sensorPlotPlane.position.set(-4, 2.5, 0); // Position above the sensor
    sensorPlotPlane.rotation.x = -Math.PI / 4; 
    scene.add(sensorPlotPlane);
    sensorPlotPlane.visible = false; // Hidden by default
}

function initPulseVisualization() {
    // 1. Create the dynamic mesh (sound wave) FIRST (Ripple visualization)
    const waveGeometry = new THREE.CylinderGeometry(0, 0.5, 0.05, 32); 
    const waveMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3498db, 
        transparent: true, 
        opacity: 0.8,
        side: THREE.DoubleSide,
        emissive: 0x3498db, 
        emissiveIntensity: 0.5
    });
    
    soundWaveMesh = new THREE.Mesh(waveGeometry, waveMaterial);

    // Rotate the cone to face forward (along the Z-axis)
    soundWaveMesh.rotation.x = Math.PI / 2; 

    // Position it at the sensor's face. 
    // We are targeting a positive Z animation, so we start it slightly forward in the positive direction.
    soundWaveMesh.position.set(0, 0, 0.2); 
    
    sensorModel.add(soundWaveMesh);
    soundWaveMesh.visible = false; 
}

function startPulseVisualization() {
    // If we are currently IDLE, kick off the first pulse.
    if (pulseState === 'IDLE') {
        pulseState = 'TRANSMIT';
        pulseStartTime = performance.now();
        soundWaveMesh.visible = true;
    }
    // Ensure the continuous loop is set to true
    continuousPulseActive = true; 
}

function stopPulseVisualization() {
    continuousPulseActive = false;
    pulseState = 'IDLE';
    if (soundWaveMesh) {
        soundWaveMesh.visible = false;
        soundWaveMesh.position.z = 0;
    }
}
function initUARTVisualization() {
    const material = new THREE.LineBasicMaterial({
        color: 0xffa500,
        linewidth: 4
    });
    
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.5, 0, 0)
    ]);
    
    uartLine = new THREE.Line(geometry, material);
    
    if (piModel) {
        // Position it near the GPIO header (relative to your Pi model)
        uartLine.position.set(-0.5, 0.5, 0); 
        piModel.add(uartLine);
        uartLine.visible = false;
    }
}


// ---------------------------------------------
// --- UPDATE LOGIC FUNCTIONS ---
// ---------------------------------------------

function drawAnalogPlot(distance) {
    if (!sensorCanvasTexture) return;

    // 1. Update History
    sensorDataHistory.push(distance);
    if (sensorDataHistory.length > MAX_HISTORY_POINTS) {
        sensorDataHistory.shift();
    }

    // 2. Setup Canvas Context
    const canvas = sensorCanvasTexture.image;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.fillStyle = '#1c2833'; 
    ctx.fillRect(0, 0, w, h);
    
    // Axis Labels
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Distance (cm): ${distance.toFixed(1)}`, 10, h - 10);
    ctx.textAlign = 'right';
    ctx.fillText('History (10s)', w - 10, h - 10);

    // 3. Draw Plot Line
    ctx.strokeStyle = '#2ecc71'; // Green plot line
    ctx.lineWidth = 2;
    ctx.beginPath();

    const minRange = 0;
    const maxRange = 200; 

    sensorDataHistory.forEach((value, index) => {
        const x = (index / (MAX_HISTORY_POINTS - 1)) * w;
        // Normalize value (0 to 1) and map to canvas height (inverted)
        const normalized = (value - minRange) / (maxRange - minRange);
        const y = h - (normalized * h);

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    sensorCanvasTexture.needsUpdate = true;
}

function drawPWM(angle) {
    if (!pwmTexture) return;

    const canvas = pwmTexture.image;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.fillStyle = '#1c2833'; 
    ctx.fillRect(0, 0, w, h);

    const pulseWidthMs = 1 + (angle / 180); 
    const dutyCycleFraction = pulseWidthMs / 20; 
    const pulseWidthPx = w * dutyCycleFraction; 

    ctx.strokeStyle = '#4CAF50'; 
    ctx.lineWidth = 4;
    ctx.beginPath();
    
    const highY = h * 0.2;
    const lowY = h * 0.8;
    
    ctx.moveTo(0, lowY);
    ctx.lineTo(0, highY); 
    ctx.lineTo(pulseWidthPx, highY); 
    ctx.lineTo(pulseWidthPx, lowY); 
    ctx.lineTo(w, lowY); 

    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Angle: ${angle}°`, 10, h - 10);
    ctx.textAlign = 'right';
    ctx.fillText(`Pulse: ${pulseWidthMs.toFixed(2)} ms`, w - 10, h - 10);

    pwmTexture.needsUpdate = true;
}

function updateServo(angle) {
    currentAngle = angle;
    const rotationRadians = THREE.MathUtils.degToRad(angle);
    
    // Feature 1: Servo Shaft Rotation
    if (servoShaft) {
        // Apply rotation to the identified shaft model
        servoShaft.rotation.z = rotationRadians; 
    }
    
    // Feature 1: PWM Graph Update (Fix)
    drawPWM(angle);
}

function updateArduinoLED(freq) {
    currentBlinkFrequency = freq;
}

function serializeUART(dataString) {
    let bits = [];
    
    let bytes = [];
    if (dataString.startsWith('0x')) {
        for (let i = 2; i < dataString.length; i += 2) {
            bytes.push(parseInt(dataString.substring(i, i + 2), 16));
        }
    } else {
        for (let i = 0; i < dataString.length; i++) {
            bytes.push(dataString.charCodeAt(i));
        }
    }

    if (bytes.length === 0) return [];

    bytes.forEach(byte => {
        // 1. Start Bit (Always 0 - LOW)
        bits.push(0); 

        // 2. Data Bits (8 bits, LSB first)
        for (let i = 0; i < 8; i++) {
            bits.push((byte >> i) & 1); 
        }

        // 3. Stop Bit (Always 1 - HIGH)
        bits.push(1); 
    });

    return bits;
}

function startUARTPulseVisualization(data) {
    uartBitBuffer = serializeUART(data);
    
    if (uartBitBuffer.length === 0) {
        console.warn("UART data is empty or invalid.");
        return;
    }
    
    uartLine.visible = true; 
    bitIndex = 0;           
    lastBitTime = performance.now(); 

    console.log(`Starting UART stream: ${uartBitBuffer.length} bits.`);
}


// ---------------------------------------------
// --- INTERFACE AND EVENT HANDLING ---
// ---------------------------------------------

function selectComponent(id) {
    // 1. CAMERA FOCUSING: Set the new target for the animate loop
    currentTarget = componentMap[id]; 
    
    const infoPanel = document.getElementById('component-info');
    const controlsArea = document.getElementById('controls-area');
    
    infoPanel.textContent = `Selected: ${id.toUpperCase()}`;
    controlsArea.innerHTML = ''; // Clear previous controls
    
    // Global Stop for Visualizations
    sensorPlotPlane.visible = false;
    pwmPlane.visible = false;
    stopPulseVisualization(); // Stops continuous ToF loop
    
    if (id === 'servo-motor') {
        // --- SERVO CONTROLS (Actuator) ---
        controlsArea.innerHTML = `
            <h3>Control Panel: Servo</h3>
            <label for="servo-angle">Servo Angle (0° to 180°):</label>
            <input type="range" id="servo-angle" min="0" max="180" value="${currentAngle}">
            <span id="angle-value">${currentAngle}°</span>
        `;
        pwmPlane.visible = true;
        
        // FIX: Only draw PWM graph on selection; rely on model load to set initial visual state.
        drawPWM(currentAngle); 
        
        const slider = document.getElementById('servo-angle');
        slider.addEventListener('input', (e) => {
            const newAngle = parseFloat(e.target.value);
            updateServo(newAngle); // Calls rotation and drawPWM
            document.getElementById('angle-value').textContent = `${newAngle}°`;
        });
        
    } else if (id === 'arduino-uno') { 
        // --- ARDUINO CONTROLS (Microcontroller) ---
        controlsArea.innerHTML = `
            <h3>Control Panel: Arduino Digital</h3>
            <p>Simulate onboard LED blinking on Pin 13.</p>
            <label for="led-frequency">Blink Frequency (Hz):</label>
            <input type="range" id="led-frequency" min="0.5" max="10" step="0.1" value="${currentBlinkFrequency}">
            <span id="frequency-value">${currentBlinkFrequency} Hz</span>
        `;
        
        const freqSlider = document.getElementById('led-frequency');
        freqSlider.addEventListener('input', (e) => {
            const freq = parseFloat(e.target.value);
            document.getElementById('frequency-value').textContent = `${freq} Hz`;
            updateArduinoLED(freq); 
        });
    } else if (id === 'capacitor') { 
        // --- CAPACITOR CONTROLS (Passive) ---
        controlsArea.innerHTML = `
            <h3>Control Panel: Capacitor</h3>
            <p>Visualizes Charge/Discharge Cycle (RC Time Constant).</p>
            <label for="charge-speed">Simulation Speed (Charge/Discharge Rate):</label>
            <input type="range" id="charge-speed" min="0.1" max="2.0" step="0.1" value="${chargingSpeed}">
            <span id="speed-value">${chargingSpeed}x Speed</span>
            <p>Charge Level: <span id="charge-level">--</span></p>
        `;
        
        const speedSlider = document.getElementById('charge-speed');
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            document.getElementById('speed-value').textContent = `${speed}x Speed`;
            chargingSpeed = speed; 
        });

        const updateChargeLevel = () => {
            const chargeLevelSpan = document.getElementById('charge-level');

            if (chargeLevelSpan) { 
                chargeLevelSpan.textContent = `${(currentCapacitorState * 100).toFixed(0)}%`; 
            } else {
                 return; 
            }

            if (currentTarget && currentTarget.userData.componentId === 'capacitor') {
                 requestAnimationFrame(updateChargeLevel);
            }
        };
        updateChargeLevel();
        
    } else if (id === 'ultrasonic-sensor') { 
        // --- ULTRASONIC SENSOR CONTROLS (Sensor) ---
        controlsArea.innerHTML = `
            <h3>Control Panel: Ultrasonic Sensor</h3>
            <p>Simulate Time-of-Flight (ToF) measurement.</p>
            <label for="sensor-distance">Object Distance (cm):</label>
            <input type="range" id="sensor-distance" min="5" max="200" step="1" value="${distanceReading}">
            <span id="distance-value">${distanceReading} cm</span>
            <p>Time-of-Flight (calculated): <span id="tof-value">${(distanceReading * 2 * 29.1).toFixed(1)} µs</span></p>
        `;
        
        const calculateTOF = (dist) => (dist * 2 * 29.1).toFixed(1); 
        
        const distSlider = document.getElementById('sensor-distance');
        const tofValueSpan = document.getElementById('tof-value');
        
        sensorPlotPlane.visible = true;
        startPulseVisualization(); // Starts the continuous loop

        distSlider.addEventListener('input', (e) => {
            const dist = parseFloat(e.target.value);
            document.getElementById('distance-value').textContent = `${dist} cm`;
            tofValueSpan.textContent = `${calculateTOF(dist)} µs`;
            distanceReading = dist; 
            
            // Re-trigger the pulse state to start a new ToF measurement instantly
            pulseState = 'TRANSMIT';
            pulseStartTime = performance.now();
        });
    } else if (id === 'raspberry-pi') { 
        // --- RASPBERRY PI CONTROLS (Microcomputer) ---
        controlsArea.innerHTML = `
            <h3>Control Panel: Raspberry Pi</h3>
            <p>Simulate UART (Serial) Data Transmission.</p>
            <label for="uart-data">Data (Hex or Text):</label>
            <input type="text" id="uart-data" value="${uartData}" maxlength="8">
            <button id="send-uart">Send Data Pulse</button>
        `;
        
        const dataInput = document.getElementById('uart-data');
        const sendButton = document.getElementById('send-uart');
        
        sendButton.addEventListener('click', () => {
            uartData = dataInput.value;
            startUARTPulseVisualization(uartData); 
            console.log(`Sending UART Data: ${uartData}`);
        });
    }
}

function onPointerClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true); 

    if (intersects.length > 0) {
        let component = intersects[0].object;
        while(component.parent && component.parent.type !== 'Scene' && component.userData.componentId === undefined) {
             component = component.parent;
        }

        if (component.userData && component.userData.componentId) {
            selectComponent(component.userData.componentId);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // 1. Smooth Camera Focusing 
    if (controls && currentTarget) {
        controls.target.lerp(currentTarget.position, 0.05); 
    }

    // 2. LED Blinking Logic (Arduino)
    if (arduinoLEDMesh && currentBlinkFrequency > 0) {
        const period = 1 / currentBlinkFrequency;
        const timeInSeconds = performance.now() / 1000;
        const toggleState = Math.floor(timeInSeconds / period) % 2; 

        if (toggleState === 0) {
            arduinoLEDMesh.material.emissive.set(0xff0000); 
        } else {
            arduinoLEDMesh.material.emissive.set(0x000000); 
        }
    }
    
    // 3. Capacitor Simulation Logic
    if (capacitorModel) {
        currentCapacitorState = (Math.sin(performance.now() * 0.001 * chargingSpeed) + 1) / 2;
        
        const intensity = currentCapacitorState * 0.8;
        capacitorModel.traverse((child) => {
            if (child.isMesh && child.material.emissive) {
                child.material.emissive.setHex(0x3498db).multiplyScalar(intensity); 
            }
        });
    }

   // 4. Ultrasonic Sensor Pulse Logic (Real-time ToF)
    if (soundWaveMesh && sensorModel && continuousPulseActive) {
        
        const scaledDistanceToWall = distanceReading * 0.05; 
        
        // Wall movement logic
        if (wallMesh) {
            // Position the wall based on the current distance along the Z-axis
            wallMesh.position.z = -scaledDistanceToWall; 
        }

        const elapsedTime = (performance.now() - pulseStartTime) / 1000;
        const totalDistanceTravelled = elapsedTime * SOUND_VELOCITY_SCALED;
        
        soundWaveMesh.visible = true;

        if (pulseState === 'TRANSMIT') {
            
            if (totalDistanceTravelled < scaledDistanceToWall) {
                // Pulse traveling outward (Correct: Moves into NEGATIVE Z space)
                soundWaveMesh.position.z = totalDistanceTravelled; 
                
                // Scaling: Expands as it travels away
                const currentRadius = 0.5 + totalDistanceTravelled * 1.5; 
                soundWaveMesh.scale.set(currentRadius, currentRadius, 1); 
                
                soundWaveMesh.material.opacity = 0.8;
            } else {
                // Wall Hit: Transition to RECEIVE
                pulseState = 'RECEIVE';
                pulseStartTime = performance.now(); 
            }

        } else if (pulseState === 'RECEIVE') {
            
            const distanceSinceImpact = elapsedTime * SOUND_VELOCITY_SCALED; 

            if (distanceSinceImpact < scaledDistanceToWall) {
                // Pulse traveling back to the sensor (Moving from -Z back to 0)
                const distanceRemaining = scaledDistanceToWall - distanceSinceImpact;
                
                // Position moves from -WallDistance back toward 0 (origin)
                soundWaveMesh.position.z = distanceRemaining; 
                
                // Scaling: Contracts as it returns
                const currentRadius = 0.5 + distanceRemaining * 1.5;
                soundWaveMesh.scale.set(currentRadius, currentRadius, 1);
                
                soundWaveMesh.material.opacity = 0.5 + (distanceRemaining / scaledDistanceToWall) * 0.3;

            } else {
                // Pulse Received: Transition back to TRANSMIT for continuous loop
                pulseState = 'TRANSMIT';
                pulseStartTime = performance.now();
                console.log("ToF cycle complete. Restarting pulse.");
            }
        }
        
        drawAnalogPlot(distanceReading);
    }

    // 5. UART Data Pulse Visualization (Raspberry Pi)
    if (uartLine && uartLine.visible) {
        const currentTime = performance.now();
        const timeElapsed = (currentTime - lastBitTime) / 1000; 

        if (bitIndex < uartBitBuffer.length) {
            
            if (timeElapsed >= bitDuration) {
                
                const currentBit = uartBitBuffer[bitIndex];

                const bitColor = currentBit === 1 ? 0xffa500 : 0x000000; 
                uartLine.material.color.setHex(bitColor);

                bitIndex++;
                lastBitTime = currentTime;
                
            }
            
            const pulseIntensity = Math.sin(currentTime * 0.01) * 0.1 + 0.9;
            uartLine.material.linewidth = 4 * pulseIntensity; 

        } else {
            uartLine.visible = false;
            bitIndex = 0;
            console.log("UART transmission complete.");
        }
    }

    controls.update(); 
    renderer.render(scene, camera);
}

function attachEventListeners() {
    window.addEventListener('resize', onWindowResize);
    container.addEventListener('click', onPointerClick);
}

function onWindowResize() {
    if(container) {
        // Updated for responsivity and pixel ratio
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
}