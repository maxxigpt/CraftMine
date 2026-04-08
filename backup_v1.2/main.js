import * as THREE from 'three';

// ==========================================
// CONFIGURACIÓN GLOBAL DEL MOTOR MUNDO
// ==========================================
const CHUNK_SIZE = 16;
const RENDER_DIST = 10;
const SEED = Math.random() * 8888;
const PLAYER_RADIUS = 0.3;
const PLAYER_HEIGHT = 1.7;
const STEP_HEIGHT = 0.6; // Medio bloque para subir escaleras automáticamente

// ==========================================
// SETUP DE THREE.JS (Renderizador, Escena, Cámara)
// ==========================================
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const skyColor = 0x87CEEB;
const waterColor = 0x011627;

scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.Fog(skyColor, 40, 250);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(50, 100, 50);
scene.add(sun);

// ==========================================
// TEXTURAS Y SHADERS (Pixel Art)
// ==========================================
function createTexture(baseColorHex, noiseIntensity = 0.2) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const color = new THREE.Color(baseColorHex);

    for (let i = 0; i < 256; i++) {
        const x = i % 16;
        const y = Math.floor(i / 16);
        const noise = (Math.random() - 0.5) * noiseIntensity;
        
        const r = Math.floor(Math.min(255, Math.max(0, color.r * 255 * (1 + noise))));
        const g = Math.floor(Math.min(255, Math.max(0, color.g * 255 * (1 + noise))));
        const b = Math.floor(Math.min(255, Math.max(0, color.b * 255 * (1 + noise))));
        
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
}

// Catálogo de bloques instanciables
const blockDefs = {
    grass: { map: createTexture(0x43a047, 0.4) },
    stone: { map: createTexture(0x7f8c8d, 0.3) },
    snow:  { map: createTexture(0xffffff, 0.1) },
    wood:  { map: createTexture(0x8b5a2b, 0.3) },
    sand:  { map: createTexture(0xebd592, 0.1) },
    water: { color: 0x2980b9, transparent: true, opacity: 0.65 }
};

// ==========================================
// ANIMACIÓN DEL BRAZO DEL JUGADOR
// ==========================================
const armGroup = new THREE.Group();
const armGeo = new THREE.BoxGeometry(0.25, 1.0, 0.45);
const armMat = new THREE.MeshLambertMaterial({ map: createTexture(0xd2a679, 0.1) });
const armMesh = new THREE.Mesh(armGeo, armMat);

armMesh.position.set(0, -0.5, 0);
armGroup.add(armMesh);
armGroup.position.set(0.65, -0.2, -0.7);
armGroup.rotation.set(-Math.PI / 6, -Math.PI / 8, 0);

camera.add(armGroup);
scene.add(camera);

let isSwinging = false;
let swingTime = 0;

function triggerArmSwing() {
    isSwinging = true;
    swingTime = 0;
}

// ==========================================
// GENERACIÓN PROCEDIMENTAL Y MAPA DE ALTURAS
// ==========================================
function getH(x, z) {
    let h = Math.sin(x * 0.035 + SEED) * Math.cos(z * 0.032 + SEED) * 11;
    h += Math.sin(x * 0.15 + SEED) * 3;
    if (h > 6) {
        h += Math.pow(h - 6, 1.6) * 1.5;
    }
    return Math.floor(h);
}

// Almacena bloques modificados (puestos/rotos) por el jugador
const heightEdits = new Map();

function getMapH(x, z) {
    x = Math.round(x);
    z = Math.round(z);
    const k = `${x},${z}`;
    if (heightEdits.has(k)) {
        return heightEdits.get(k);
    }
    return getH(x, z);
}

// ==========================================
// MOTOR DE FÍSICAS Y COLISIONES AABB
// ==========================================
function getSolidHeight(x, z) {
    const rx1 = x + PLAYER_RADIUS;
    const rx2 = x - PLAYER_RADIUS;
    const rz1 = z + PLAYER_RADIUS;
    const rz2 = z - PLAYER_RADIUS;
    
    return Math.max(
        getMapH(rx1, rz1), 
        getMapH(rx2, rz1),
        getMapH(rx1, rz2), 
        getMapH(rx2, rz2)
    ) + 0.5;
}

function getFloorHeight(x, z, feetY) {
    const rx1 = x + PLAYER_RADIUS;
    const rx2 = x - PLAYER_RADIUS;
    const rz1 = z + PLAYER_RADIUS;
    const rz2 = z - PLAYER_RADIUS;
    
    const h1 = getMapH(rx1, rz1) + 0.5;
    const h2 = getMapH(rx2, rz1) + 0.5;
    const h3 = getMapH(rx1, rz2) + 0.5;
    const h4 = getMapH(rx2, rz2) + 0.5;

    let maxH = -999;
    
    if (h1 <= feetY + STEP_HEIGHT && h1 > maxH) maxH = h1;
    if (h2 <= feetY + STEP_HEIGHT && h2 > maxH) maxH = h2;
    if (h3 <= feetY + STEP_HEIGHT && h3 > maxH) maxH = h3;
    if (h4 <= feetY + STEP_HEIGHT && h4 > maxH) maxH = h4;

    if (maxH === -999) {
        return getMapH(x, z) + 0.5;
    }
    return maxH;
}

// ==========================================
// GESTIÓN DE CHUNKS (Generación infinita)
// ==========================================
const chunks = new Map();
const dummy = new THREE.Object3D();
const interactables = [];

class Chunk {
    constructor(cx, cz) {
        this.cx = cx;
        this.cz = cz;
        this.group = new THREE.Group();
        this.group.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
        this.meshes = [];
    }

    generate() {
        const pools = {};
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const wx = this.cx * CHUNK_SIZE + x;
                const wz = this.cz * CHUNK_SIZE + z;
                
                const k = `${wx},${wz}`;
                const baseH = getH(wx, wz);
                const h = heightEdits.has(k) ? heightEdits.get(k) : baseH;
                const hn = Math.min(
                    getH(wx + 1, wz), 
                    getH(wx - 1, wz), 
                    getH(wx, wz + 1), 
                    getH(wx, wz - 1)
                );

                let type = (h > 15) ? 'snow' : (h > 8 ? 'stone' : 'grass');

                dummy.position.set(x, h, z);
                dummy.updateMatrix();
                
                if (!pools[type]) pools[type] = [];
                pools[type].push(dummy.matrix.clone());

                // Relleno hacia abajo para evitar vacíos
                if (h > hn + 1 && baseH === h) {
                    for (let y = h - 1; y >= hn; y--) {
                        dummy.position.set(x, y, z);
                        dummy.updateMatrix();
                        if (!pools['stone']) pools['stone'] = [];
                        pools['stone'].push(dummy.matrix.clone());
                    }
                }

                // Generación de Agua
                if (h < 0) {
                    dummy.position.set(x, 0.4, z);
                    dummy.updateMatrix();
                    if (!pools['water']) pools['water'] = [];
                    pools['water'].push(dummy.matrix.clone());
                }
            }
        }

        // Ensamblar las geometrías instanciadas del terreno
        for (const k in pools) {
            const mat = new THREE.MeshLambertMaterial(blockDefs[k]);
            const geom = (k === 'water') ? new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2) : new THREE.BoxGeometry(1, 1, 1);
            const m = new THREE.InstancedMesh(geom, mat, pools[k].length);
            
            for (let i = 0; i < pools[k].length; i++) {
                m.setMatrixAt(i, pools[k][i]);
            }
            m.matrixAutoUpdate = false;
            this.group.add(m);
            this.meshes.push(m);
            
            if (k !== 'water') {
                interactables.push(m);
            }
        }
        scene.add(this.group);
    }

    dispose() {
        scene.remove(this.group);
        this.meshes.forEach(m => {
            const idx = interactables.indexOf(m);
            if (idx > -1) interactables.splice(idx, 1);
            m.geometry.dispose();
            m.material.dispose();
        });
    }
}

function updateChunks() {
    const px = Math.floor(camera.position.x / CHUNK_SIZE);
    const pz = Math.floor(camera.position.z / CHUNK_SIZE);
    
    // Cargar nuevos chunks cercanos
    for (let x = px - RENDER_DIST; x <= px + RENDER_DIST; x++) {
        for (let z = pz - RENDER_DIST; z <= pz + RENDER_DIST; z++) {
            const key = `${x},${z}`;
            if (!chunks.has(key)) {
                const c = new Chunk(x, z);
                c.generate();
                chunks.set(key, c);
            }
        }
    }

    // Limpiar chunks lejanos (Gestión de Memoria)
    for (const [key, c] of chunks) {
        if (Math.abs(c.cx - px) > RENDER_DIST + 1 || Math.abs(c.cz - pz) > RENDER_DIST + 1) {
            c.dispose();
            chunks.delete(key);
        }
    }
}

// ==========================================
// RAYCASTER: INTERACCIÓN BLOQUES (Romper/Poner)
// ==========================================
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);
let selectedType = 'stone';

document.addEventListener('mousedown', (e) => {
    if (!isLocked) return;

    raycaster.setFromCamera(screenCenter, camera);
    const intersects = raycaster.intersectObjects(interactables, false);

    if (intersects.length > 0) {
        const hit = intersects[0];
        
        if (hit.distance > 7) return; // Rango de alcance

        if (e.button === 0) {
            // Acción: Romper Bloque
            if (hit.object.isInstancedMesh) {
                const matrix = new THREE.Matrix4();
                hit.object.getMatrixAt(hit.instanceId, matrix);
                
                const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
                hit.object.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), new THREE.Vector3());
                pos.applyMatrix4(hit.object.matrixWorld);
                
                // Reducir la escala visual a cero para "desaparecerlo"
                matrix.makeScale(0, 0, 0);
                hit.object.setMatrixAt(hit.instanceId, matrix);
                hit.object.instanceMatrix.needsUpdate = true;
                
                heightEdits.set(`${Math.round(pos.x)},${Math.round(pos.z)}`, pos.y - 1);
                triggerArmSwing();
                
            } else if (hit.object.userData.isPlaced) {
                scene.remove(hit.object);
                const idx = interactables.indexOf(hit.object);
                if (idx > -1) interactables.splice(idx, 1);
                
                const pos = hit.object.position;
                heightEdits.set(`${Math.round(pos.x)},${Math.round(pos.z)}`, pos.y - 1);
                triggerArmSwing();
            }
        } else if (e.button === 2) {
            // Acción: Colocar Bloque
            const hitNorm = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
            const normMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
            hitNorm.applyMatrix3(normMatrix).normalize();

            const p = hit.point.clone().add(hitNorm.clone().multiplyScalar(0.1));
            const px = Math.round(p.x);
            const py = Math.round(p.y);
            const pz = Math.round(p.z);

            // Evitar ahogamiento/colocar el bloque sobre nuestro el espacio de nuestro cuerpo
            const pCamX = Math.round(camera.position.x);
            const pCamZ = Math.round(camera.position.z);
            if (Math.abs(px - pCamX) < 1 && Math.abs(pz - pCamZ) < 1 && py > camera.position.y - 2 && py < camera.position.y + 1) {
                return;
            }

            const mat = new THREE.MeshLambertMaterial(blockDefs[selectedType]);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
            mesh.position.set(px, py, pz);
            mesh.userData.isPlaced = true;
            
            scene.add(mesh);
            interactables.push(mesh);
            
            const curH = getMapH(px, pz);
            if (py > curH) {
                heightEdits.set(`${px},${pz}`, py);
            }
            triggerArmSwing();
        }
    }
});

// ==========================================
// CONTROLES DE CÁMARA (PointerLock Editado)
// ==========================================
let isLocked = false;
let sensX = 1.0;
let sensY = 1.0;

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;

document.addEventListener('pointerlockchange', () => {
    isLocked = (document.pointerLockElement === document.body);
    const pm = document.getElementById('pause-menu');
    
    if (isLocked) {
        pm.classList.add('hidden');
    } else {
        pm.classList.remove('hidden');
    }
});

document.body.addEventListener('mousemove', (e) => {
    if (!isLocked) return;
    
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= e.movementX * 0.002 * sensX;
    euler.x -= e.movementY * 0.002 * sensY;
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
    
    camera.quaternion.setFromEuler(euler);
});

// ==========================================
// UI INTERFAZ, MENÚS & EVENTOS GLOBALES
// ==========================================
let gameMode = 'survival';

document.getElementById('btn-resume').addEventListener('click', () => {
    document.body.requestPointerLock();
});

document.getElementById('btn-settings').addEventListener('click', () => {
    document.getElementById('menu-main').classList.add('hidden');
    document.getElementById('menu-settings').classList.remove('hidden');
});

document.getElementById('btn-back').addEventListener('click', () => {
    document.getElementById('menu-settings').classList.add('hidden');
    document.getElementById('menu-main').classList.remove('hidden');
});

document.getElementById('btn-quit').addEventListener('click', () => {
    alert("Juego guardado (Demo). ¡Hasta luego!");
    window.location.reload();
});

document.getElementById('sens-x').addEventListener('input', (e) => {
    sensX = parseFloat(e.target.value);
    document.getElementById('val-sens-x').innerText = sensX.toFixed(1);
});

document.getElementById('sens-y').addEventListener('input', (e) => {
    sensY = parseFloat(e.target.value);
    document.getElementById('val-sens-y').innerText = sensY.toFixed(1);
});

document.getElementById('game-mode').addEventListener('change', (e) => {
    gameMode = e.target.value;
    isFlying = false;
    document.getElementById('hearts-container').style.display = (gameMode === 'creative') ? 'none' : 'flex';
});

const slotTypes = ['stone', 'grass', 'snow', 'wood', 'sand', 'stone', 'grass', 'wood', 'sand'];
document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '9') {
        document.querySelectorAll('.hotbar-slot').forEach(s => s.classList.remove('active'));
        document.querySelector(`.hotbar-slot[data-id="${e.key}"]`).classList.add('active');
        selectedType = slotTypes[parseInt(e.key) - 1];
    }
});

// ==========================================
// REGISTRO DE INPUTS FÍSICOS (Teclado)
// ==========================================
let mF = 0, mB = 0, mL = 0, mR = 0, mU = 0, mD = 0;
let spr = 0, lW = 0;
let vel = new THREE.Vector3();
let isFlying = false;
let lastSpaceTime = 0;

document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') {
        const t = performance.now();
        if (!mF && t - lW < 300) spr = 1;
        lW = t;
        mF = 1;
    }
    if (e.code === 'KeyS') mB = 1;
    if (e.code === 'KeyA') mL = 1;
    if (e.code === 'KeyD') mR = 1;
    
    if (e.code === 'Space') {
        if (gameMode === 'creative' && performance.now() - lastSpaceTime < 300) {
            isFlying = !isFlying;
            vel.y = 0;
        }
        lastSpaceTime = performance.now();
        mU = 1;
    }
    if (e.code === 'ShiftLeft') mD = 1;
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') { mF = 0; spr = 0; }
    if (e.code === 'KeyS') mB = 0;
    if (e.code === 'KeyA') mL = 0;
    if (e.code === 'KeyD') mR = 0;
    if (e.code === 'Space') mU = 0;
    if (e.code === 'ShiftLeft') mD = 0;
});

// ==========================================
// BUCLE PRINCIPAL DE ANIMACIÓN Y RENDER
// ==========================================
camera.position.set(0, 30, 0);

let pTime = performance.now();
let fC = 0;
let lFps = performance.now();

function animate() {
    requestAnimationFrame(animate);
    const t = performance.now();
    const d = Math.min((t - pTime) / 1000, 0.05);
    
    // Contador FPS en pantalla
    fC++;
    if (t - lFps >= 1000) {
        document.getElementById('fps').innerText = 'FPS: ' + fC;
        fC = 0;
        lFps = t;
    }

    if (isLocked) {
        updateChunks();

        const feetY = camera.position.y - PLAYER_HEIGHT;
        const curSolidY = getFloorHeight(camera.position.x, camera.position.z, feetY);
        const inW = (feetY <= 1.0 && getMapH(camera.position.x, camera.position.z) < 0);

        // Renderizado ambiental condicional (Bajo el agua vs Superficie)
        if (inW) {
            scene.fog.color.setHex(waterColor);
            scene.background.setHex(waterColor);
            scene.fog.near = 0;
            scene.fog.far = 15;
        } else {
            scene.fog.color.setHex(skyColor);
            scene.background.setHex(skyColor);
            scene.fog.near = 40;
            scene.fog.far = 250;
        }

        // Efecto de Campo Visual Dinámico para Sprint
        camera.fov += (((spr && mF) ? 88 : 75) - camera.fov) * 0.15;
        camera.updateProjectionMatrix();

        // Sistema de Marcha de Velocidades
        let s = inW ? 2.5 : (spr ? 5.6 : 4.3);
        if (gameMode === 'creative' && isFlying) {
            s = spr ? 15.0 : 8.0;
        }

        if (!isFlying) {
            vel.y -= (inW ? 10 : 35) * d;
        }

        // Traducir Control de Cámara a Vector Físico
        const dir = new THREE.Vector3(Number(mR) - Number(mL), 0, Number(mF) - Number(mB));
        
        if (dir.lengthSq() > 0) {
            dir.normalize();
            const camQ = camera.quaternion.clone();
            
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camQ);
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camQ);
            
            forward.y = 0; right.y = 0;
            forward.normalize(); right.normalize();

            vel.x = (forward.x * dir.z + right.x * dir.x) * s;
            vel.z = (forward.z * dir.z + right.z * dir.x) * s;
        } else {
            vel.x = 0;
            vel.z = 0;
        }

        const onGround = (feetY - curSolidY) <= 0.1;

        // Visual Inmersivo del Brazo (Swing por Click o Balanceo de caminata)
        if (isSwinging) {
            swingTime += d * 15;
            armGroup.rotation.x = -Math.PI / 6 - Math.sin(swingTime) * 1.0;
            
            if (swingTime > Math.PI) {
                isSwinging = false;
                armGroup.rotation.x = -Math.PI / 6;
            }
        } else if (onGround && (vel.x !== 0 || vel.z !== 0) && !isFlying) {
            armGroup.rotation.x = -Math.PI / 6 + Math.sin(t * 0.012) * 0.08;
            armGroup.rotation.z = Math.cos(t * 0.006) * 0.04;
        } else {
            armGroup.rotation.x = THREE.MathUtils.lerp(armGroup.rotation.x, -Math.PI / 6, 10 * d);
            armGroup.rotation.z = THREE.MathUtils.lerp(armGroup.rotation.z, 0, 10 * d);
        }

        // Modos de Elevación
        if (!isFlying) {
            if (inW) { // Natación
                if (mU) { vel.y += 24 * d; if (feetY > -0.3) vel.y = 6; }
                if (mD) vel.y -= 25 * d;
                vel.y = Math.max(Math.min(vel.y, 6), -4);
            } else if (mU && onGround && vel.y <= 0) {
                vel.y = 8.5; // Salto normal pre-calibrado a 1 bloque
            }
        } else { 
            if (mU) vel.y = 10;
            else if (mD) vel.y = -10;
            else vel.y *= 0.8; // Fricción al detener impulso de vuelo
        }

        // Resolución de Colisiones X / Z (Revisión de paredes)
        camera.position.y += vel.y * d;
        let newFeetY = camera.position.y - PLAYER_HEIGHT;

        if (vel.x !== 0) {
            const nextX = camera.position.x + vel.x * d;
            const hX = getSolidHeight(nextX, camera.position.z);
            if (hX > newFeetY + STEP_HEIGHT && !isFlying) {
                vel.x = 0;
            } else {
                camera.position.x = nextX;
            }
        }

        if (vel.z !== 0) {
            const nextZ = camera.position.z + vel.z * d;
            const hZ = getSolidHeight(camera.position.x, nextZ);
            if (hZ > newFeetY + STEP_HEIGHT && !isFlying) {
                vel.z = 0;
            } else {
                camera.position.z = nextZ;
            }
        }

        // Cierre y adaptación sobre terreno
        const finalFloorY = getFloorHeight(camera.position.x, camera.position.z, camera.position.y - PLAYER_HEIGHT);
        
        if (camera.position.y - PLAYER_HEIGHT < finalFloorY) {
            camera.position.y = finalFloorY + PLAYER_HEIGHT;
            vel.y = 0;
            
            if (isFlying) isFlying = false; // Aterrizaje interrumpe vuelo
        }
    }
    
    pTime = t;
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Despertar Bucle Gráfico Central
animate();
