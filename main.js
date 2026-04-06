import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- ESCENA ---
const scene = new THREE.Scene();
const skyColor = 0x87CEEB;
const waterDeepColor = 0x001122; 
scene.background = new THREE.Color(skyColor);
const globalFog = new THREE.Fog(skyColor, 35, 100);
scene.fog = globalFog;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(10, 50, 10);
scene.add(sun);

const controls = new PointerLockControls(camera, document.body);
document.body.addEventListener('click', () => controls.lock());

// --- INPUTS ---
let moveF = false, moveB = false, moveL = false, moveR = false, moveUp = false, moveDown = false;
let isSprinting = false;
let lastWPressTime = 0;
let velocity = new THREE.Vector3();

document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') {
        const time = performance.now();
        if (!moveF && time - lastWPressTime < 300) isSprinting = true;
        lastWPressTime = time;
        moveF = true;
    }
    if(e.code === 'KeyS') moveB = true;
    if(e.code === 'KeyA') moveL = true;
    if(e.code === 'KeyD') moveR = true;
    if(e.code === 'Space') moveUp = true;
    if(e.code === 'ShiftLeft') moveDown = true;
});
document.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') { moveF = false; isSprinting = false; }
    if(e.code === 'KeyS') moveB = false;
    if(e.code === 'KeyA') moveL = false;
    if(e.code === 'KeyD') moveR = false;
    if(e.code === 'Space') moveUp = false;
    if(e.code === 'ShiftLeft') moveDown = false;
});

// --- MUNDO ---
const worldSize = 100;
const heightCache = new Int8Array((worldSize + 1) * (worldSize + 1));

function getBlockH(x, z) {
    const bx = Math.round(x) + worldSize / 2;
    const bz = Math.round(z) + worldSize / 2;
    if (bx < 0 || bx >= worldSize || bz < 0 || bz >= worldSize) return -10;
    return heightCache[bx * worldSize + bz];
}

for (let x = -worldSize/2; x <= worldSize/2; x++) {
    for (let z = -worldSize/2; z <= worldSize/2; z++) {
        const h = Math.floor(Math.sin(x * 0.08) * Math.cos(z * 0.08) * 12 + Math.sin(x * 0.4) * 2);
        heightCache[(x + worldSize/2) * worldSize + (z + worldSize/2)] = h;
    }
}

const solidGeo = new THREE.BoxGeometry(1, 1, 1);
const waterGeo = new THREE.PlaneGeometry(1, 1);
waterGeo.rotateX(-Math.PI / 2);

const blockData = {
    grass: { mat: new THREE.MeshLambertMaterial({ color: 0x2d8a2d }), transforms: [] },
    stone: { mat: new THREE.MeshLambertMaterial({ color: 0x666666 }), transforms: [] },
    snow:  { mat: new THREE.MeshLambertMaterial({ color: 0xffffff }), transforms: [] },
    water: { mat: new THREE.MeshLambertMaterial({ 
        color: 0x0066cc, transparent: true, opacity: 0.85, side: THREE.DoubleSide 
    }), transforms: [] }
};

const dummy = new THREE.Object3D();
for (let x = -worldSize/2; x < worldSize/2; x++) {
    for (let z = -worldSize/2; z < worldSize/2; z++) {
        const h = getBlockH(x, z);
        for (let y = -12; y <= h; y++) {
            dummy.position.set(x, y, z); dummy.updateMatrix();
            if (y > 8) blockData.snow.transforms.push(dummy.matrix.clone());
            else if (y > 4) blockData.stone.transforms.push(dummy.matrix.clone());
            else blockData.grass.transforms.push(dummy.matrix.clone());
        }
        if (h < 0) {
            dummy.position.set(x, 0.4, z); // Agua ligeramente bajo el nivel del bloque (0.5)
            dummy.updateMatrix();
            blockData.water.transforms.push(dummy.matrix.clone());
        }
    }
}

for (const key in blockData) {
    const data = blockData[key];
    const geo = (key === 'water') ? waterGeo : solidGeo;
    const iMesh = new THREE.InstancedMesh(geo, data.mat, data.transforms.length);
    for (let i = 0; i < data.transforms.length; i++) iMesh.setMatrixAt(i, data.transforms[i]);
    iMesh.matrixAutoUpdate = false;
    scene.add(iMesh);
}

// Nubes
const cloudGeo = new THREE.BoxGeometry(15, 2, 10);
const cloudMat = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.7});
for (let i = 0; i < 15; i++) {
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    cloud.position.set((Math.random()-0.5)*180, 25, (Math.random()-0.5)*180);
    scene.add(cloud);
}

camera.position.set(0, getBlockH(0, 0) + 2, 0);

// --- FÍSICAS ---
const pHeight = 1.8; 
const pRadius = 0.3; 
function getMaxHeightUnderPlayer(px, pz) {
    return Math.max(getBlockH(px+pRadius, pz+pRadius), getBlockH(px-pRadius, pz+pRadius), 
                    getBlockH(px+pRadius, pz-pRadius), getBlockH(px-pRadius, pz-pRadius));
}

let prevTime = performance.now();
const fpsElement = document.getElementById('fps');
let fpsFrames = 0, lastFpsTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.05);
    
    fpsFrames++;
    if (time - lastFpsTime >= 1000) {
        fpsElement.innerText = 'FPS: ' + fpsFrames;
        fpsFrames = 0; lastFpsTime = time;
    }

    if (controls.isLocked) {
        const px = camera.position.x;
        const pz = camera.position.z;
        const terrainH = getBlockH(px, pz);
        const inWater = (camera.position.y <= 0.5 && terrainH < 0);

        // Niebla submarina
        if (inWater) { 
            scene.fog.color.setHex(waterDeepColor); scene.background.setHex(waterDeepColor);
            scene.fog.near = 0; scene.fog.far = 10;
        } else { 
            scene.fog.color.setHex(skyColor); scene.background.setHex(skyColor);
            scene.fog.near = 35; scene.fog.far = 100; 
        }

        // FOV
        camera.fov += (((isSprinting && moveF) ? 88 : 75) - camera.fov) * 0.15;
        camera.updateProjectionMatrix();

        // Movimiento
        let speed = inWater ? 15 : (isSprinting ? 52 : 26);
        velocity.y -= (inWater ? 5.0 : 35.0) * delta;

        if (moveF || moveB) velocity.z -= (Number(moveF) - Number(moveB)) * speed * delta;
        if (moveL || moveR) velocity.x -= (Number(moveR) - Number(moveL)) * speed * delta;

        const groundLimitCheck = getMaxHeightUnderPlayer(px, pz) + pHeight;
        const onGround = (camera.position.y - groundLimitCheck) < 0.1;

        // --- MECÁNICA DE SALTO Y SALIDA ---
        if (inWater) {
            if (moveUp) {
                velocity.y += 24 * delta;
                // Si estamos cerca de la superficie, damos un impulso extra para "saltar" a la tierra
                if (camera.position.y > -0.3) velocity.y = 9; 
            }
            if (moveDown) velocity.y -= 20 * delta;
            velocity.y = Math.max(Math.min(velocity.y, 9), -4);
        } else if (moveUp && onGround) {
            velocity.y = 9.5; 
        }

        // --- COLISIONES CON CORRECCIÓN DE SALIDA DE AGUA ---
        const oldPos = camera.position.clone();
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        const targetPos = camera.position.clone();
        camera.position.copy(oldPos);

        // Tolerancia de escalón: Si estamos en el agua saltando, permitimos subir bloques
        const isExitingWater = inWater && moveUp && camera.position.y > -0.5;
        const stepHeight = isExitingWater ? 0.8 : 0.2; // Aumentamos la capacidad de subir escalones al salir del agua
        const maxStep = oldPos.y - pHeight + stepHeight;

        camera.position.x += (targetPos.x - oldPos.x);
        if (getMaxHeightUnderPlayer(camera.position.x, oldPos.z) > maxStep) {
            camera.position.x = oldPos.x;
        }

        camera.position.z += (targetPos.z - oldPos.z);
        if (getMaxHeightUnderPlayer(camera.position.x, camera.position.z) > maxStep) {
            camera.position.z = oldPos.z;
        }

        camera.position.y += velocity.y * delta;
        const finalGround = getMaxHeightUnderPlayer(camera.position.x, camera.position.z) + pHeight;
        if (camera.position.y < finalGround) {
            velocity.y = 0; camera.position.y = finalGround;
        }

        velocity.x -= velocity.x * (inWater ? 4.0 : 10.0) * delta;
        velocity.z -= velocity.z * (inWater ? 4.0 : 10.0) * delta;
    }
    prevTime = time;
    renderer.render(scene, camera);
}
animate();
