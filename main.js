import * as THREE from 'three';

// --- AUTO-GENERATED SLOTS ---
(function() {
    let invMain = '';
    for(let i=0; i<27; i++) invMain += `<div class="hotbar-slot" id="slot-${i+9}" onmousedown="handleSlotClick(event, 'inv', ${i+9})" onmouseenter="handleSlotEnter('inv', ${i+9})" oncontextmenu="return false"></div>`;
    const invMainEl = document.getElementById('inv-main-slots');
    if(invMainEl) invMainEl.innerHTML = invMain;

    let invHot = '';
    for(let i=0; i<9; i++) invHot += `<div class="hotbar-slot" id="slot-${i}" onmousedown="handleSlotClick(event, 'inv', ${i})" onmouseenter="handleSlotEnter('inv', ${i})" oncontextmenu="return false"></div>`;
    const invHotEl = document.getElementById('inv-hotbar-slots');
    if(invHotEl) invHotEl.innerHTML = invHot;

    const hudHotbar = document.querySelector('.hud-center .hotbar');
    if(hudHotbar) {
        let hudSlots = '';
        for(let i=0; i<9; i++) {
            hudSlots += `<div class="hotbar-slot${i===0?' active':''}" id="hud-slot-${i}" data-id="${i+1}"></div>`;
        }
        hudHotbar.innerHTML = hudSlots;
    }
})();
const CHUNK_SIZE = 16;
const RENDER_DIST = 10;
const SEED = Math.random() * 8888;
const PLAYER_RADIUS = 0.3;
const PLAYER_HEIGHT = 1.7;
const STEP_HEIGHT = 0.6; // Medio bloque para subir escaleras automÃ¡ticamente

// ==========================================
// SETUP DE THREE.JS (Renderizador, Escena, CÃ¡mara)
// ==========================================
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const skyColor = 0x87CEEB;
const waterColor = 0x011627;

scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.Fog(skyColor, 40, 250);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// ==========================================
// TERCERA PERSONA (F6)
// ==========================================
const tpsCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let cameraMode = 0; // 0: 1ra, 1: 3ra espalda, 2: 3ra frente

const tpsPlayer = new THREE.Group();
const mYellow = new THREE.MeshLambertMaterial({color: 0xffd90f});
const mWhite = new THREE.MeshLambertMaterial({color: 0xffffff});
const mBlue = new THREE.MeshLambertMaterial({color: 0x488cf9});
const mBeard = new THREE.MeshLambertMaterial({color: 0xc19a6b});
const mGray = new THREE.MeshLambertMaterial({color: 0x555555});

const pHeadGroup = new THREE.Group();
const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mYellow);
const pBeard = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.52), mBeard);
pBeard.position.y = -0.15;
pHeadGroup.add(pHead); pHeadGroup.add(pBeard);

// Rostro y pelo
const mBlack = new THREE.MeshLambertMaterial({color: 0x000000});
const _pEyeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.05), mWhite); _pEyeL.position.set(0.12, 0.05, 0.26);
const _pPupilL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), mBlack); _pPupilL.position.set(0.12, 0.05, 0.28);
pHeadGroup.add(_pEyeL); pHeadGroup.add(_pPupilL);
const _pEyeR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.05), mWhite); _pEyeR.position.set(-0.12, 0.05, 0.26);
const _pPupilR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), mBlack); _pPupilR.position.set(-0.12, 0.05, 0.28);
pHeadGroup.add(_pEyeR); pHeadGroup.add(_pPupilR);
const _pHair1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.03), mBlack); _pHair1.position.set(-0.06, 0.28, 0); _pHair1.rotation.z = Math.PI / 8;
const _pHair2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.03), mBlack); _pHair2.position.set(0.06, 0.28, 0); _pHair2.rotation.z = -Math.PI / 8;
pHeadGroup.add(_pHair1); pHeadGroup.add(_pHair2);

pHeadGroup.position.y = 0.625;
tpsPlayer.add(pHeadGroup);

const pTorso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.25), mWhite);
pTorso.position.y = 0.0;
tpsPlayer.add(pTorso);

const pArmL = new THREE.Group();
const pArmLTop = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), mWhite); pArmLTop.position.y = 0.25;
const pArmLBot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), mYellow); pArmLBot.position.y = -0.125;
pArmL.add(pArmLTop); pArmL.add(pArmLBot); pArmL.position.set(0.375, 0.125, 0); tpsPlayer.add(pArmL);

const pArmR = new THREE.Group();
const pArmRTop = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), mWhite); pArmRTop.position.y = 0.25;
const pArmRBot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), mYellow); pArmRBot.position.y = -0.125;
pArmR.add(pArmRTop); pArmR.add(pArmRBot); pArmR.position.set(-0.375, 0.125, 0); tpsPlayer.add(pArmR);

const pLegL = new THREE.Group();
const pLegLP = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), mBlue); pLegLP.position.y = 0.075;
const pShoeL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.25), mGray); pShoeL.position.y = -0.3;
pLegL.add(pLegLP); pLegL.add(pShoeL); pLegL.position.set(0.125, -0.75, 0); tpsPlayer.add(pLegL);

const pLegR = new THREE.Group();
const pLegRP = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), mBlue); pLegRP.position.y = 0.075;
const pShoeR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.25), mGray); pShoeR.position.y = -0.3;
pLegR.add(pLegRP); pLegR.add(pShoeR); pLegR.position.set(-0.125, -0.75, 0); tpsPlayer.add(pLegR);

tpsPlayer.userData = { pArmL, pArmR, pLegL, pLegR, pHeadGroup };
tpsPlayer.visible = false;
scene.add(tpsPlayer);

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(50, 100, 50);
scene.add(sun);

// ==========================================
// TEXTURAS Y SHADERS (Pixel Art)
// ==========================================
function drawPattern(ctx, type) {
    if (type === 'log_top') {
        ctx.fillStyle = '#7d6342'; ctx.fillRect(0,0,16,16);
        ctx.fillStyle = '#a1887f'; ctx.fillRect(2,2,12,12);
        ctx.fillStyle = '#7d6342'; ctx.fillRect(4,4,8,8);
        ctx.fillStyle = '#a1887f'; ctx.fillRect(6,6,4,4);
    } else if (type === 'log_side' || type === 'wood') {
        ctx.fillStyle = '#6d4c21'; ctx.fillRect(0,0,16,16);
        ctx.fillStyle = '#3e2723';
        [0, 2, 5, 8, 11, 14].forEach(x => ctx.fillRect(x, 0, 2, 16));
        for(let i=0; i<15; i++) {
            ctx.fillStyle = '#2d1b18';
            ctx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 2);
        }
    } else if (type === 'grass_top') {
        ctx.fillStyle = '#7cfc00'; ctx.fillRect(0,0,16,16);
        for(let i=0; i<40; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#55cc00' : '#a0ff55';
            ctx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
        }
    } else if (type === 'grass_side' || type === 'grass') {
        ctx.fillStyle = '#5d4037'; ctx.fillRect(0,0,16,16);
        ctx.fillStyle = '#8d6e63'; 
        for(let i=0; i<8; i++) ctx.fillRect(Math.random()*16, 5+Math.random()*11, 1, 1);
        ctx.fillStyle = '#7cfc00';
        ctx.fillRect(0,0,16,3);
        const teeth = [5,4,3,6,4,3,3,5,6,4,3,5,4,3,3,4];
        for(let x=0; x<16; x++) ctx.fillRect(x, 0, 1, teeth[x]);
    } else if (type === 'dirt') {
        ctx.fillStyle = '#5d4037'; ctx.fillRect(0,0,16,16);
        for(let i=0; i<15; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#795548' : '#4e342e';
            ctx.fillRect(Math.random()*15, Math.random()*15, 2, 1);
        }
    } else if (type === 'planks') {
        ctx.fillStyle = '#b08d57'; ctx.fillRect(0,0,16,16);
        ctx.fillStyle = '#7d6342';
        for(let y=0; y<16; y+=4) ctx.fillRect(0, y, 16, 1);
        for(let i=0; i<25; i++) {
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(Math.random()*16, Math.random()*16, 2+Math.random()*3, 1);
        }
    } else if (type === 'skin') {
        ctx.fillStyle = '#ffd90f'; ctx.fillRect(0,0,16,16);
        for(let i=0; i<15; i++) {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.fillRect(Math.random()*16, Math.random()*16, 1, 1);
        }
    } else if (type === 'sleeve') {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,16,16);
        for(let i=0; i<10; i++) {
            ctx.fillStyle = 'rgba(0,0,0,0.03)';
            ctx.fillRect(Math.random()*16, Math.random()*16, 1, 1);
        }
    } else if (type === 'stone') {
        ctx.fillStyle = '#9e9e9e'; ctx.fillRect(0,0,16,16);
        ctx.fillStyle = '#888888';
        for(let i=0; i<15; i++) ctx.fillRect(Math.random()*15, Math.random()*15, 2, 2);
        ctx.strokeStyle = '#616161'; ctx.strokeRect(0,0,16,16);
    } else if (type === 'snow') {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,16,16);
        ctx.fillStyle = '#f0f0f0';
        for(let i=0; i<20; i++) ctx.fillRect(Math.random()*16, Math.random()*16, 1, 1);
    } else if (type === 'sand') {
        ctx.fillStyle = '#f4e1a1'; ctx.fillRect(0,0,16,16);
        ctx.fillStyle = '#e5d190';
        for(let i=0; i<20; i++) ctx.fillRect(Math.random()*16, Math.random()*16, 1, 1);
    } else if (type === 'leaves') {
        ctx.fillStyle = '#1b5e20'; ctx.fillRect(0,0,16,16);
        for(let i=0; i<40; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#2e7d32' : '#0a3d0a';
            ctx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
        }
    } else if (type === 'crafting_table') {
        ctx.fillStyle = '#d2b48c'; ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(0, 0, 16, 2); ctx.fillRect(0, 14, 16, 2);
        ctx.fillRect(0, 0, 2, 16); ctx.fillRect(14, 0, 2, 16);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(3, 3, 10, 10);
        ctx.fillStyle = '#c19a6b';
        for(let i=0; i<3; i++) for(let j=0; j<3; j++) ctx.fillRect(4 + i*3, 4 + j*3, 2, 2);
    } else {
        ctx.fillStyle = type.startsWith('#') ? type : '#ffffff';
        ctx.fillRect(0,0,16,16);
    }
}

function createTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    drawPattern(canvas.getContext('2d'), type);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
}

// CatÃ¡logo de bloques instanciables con soporte multi-cara
const blockDefs = {
    grass: [
        { map: createTexture('grass_side') }, { map: createTexture('grass_side') },
        { map: createTexture('grass_top') }, { map: createTexture('dirt') },
        { map: createTexture('grass_side') }, { map: createTexture('grass_side') }
    ],
    stone: { map: createTexture('stone') },
    snow:  { map: createTexture('snow') },
    wood: [
        { map: createTexture('log_side') }, { map: createTexture('log_side') },
        { map: createTexture('log_top') }, { map: createTexture('log_top') },
        { map: createTexture('log_side') }, { map: createTexture('log_side') }
    ],
    sand:  { map: createTexture('sand') },
    dirt:  { map: createTexture('dirt') },
    leaves: { map: createTexture('leaves') },
    planks: { map: createTexture('planks') },
    crafting_table: { map: createTexture('crafting_table') },
    water: { color: 0x2980b9, transparent: true, opacity: 0.65 }
};

// CachÃ© de materiales y geometrÃ­as para optimizar rendimiento
const blockMaterials = {};
for (const k in blockDefs) {
    if (k === 'water') {
        blockMaterials[k] = new THREE.MeshLambertMaterial(blockDefs[k]);
    } else if (Array.isArray(blockDefs[k])) {
        blockMaterials[k] = blockDefs[k].map(props => new THREE.MeshLambertMaterial(props));
    } else {
        blockMaterials[k] = new THREE.MeshLambertMaterial(blockDefs[k]);
    }
}
const boxGeom = new THREE.BoxGeometry(1, 1, 1);
const waterGeom = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const armGroup = new THREE.Group();

// En la vista de primera persona, la orientación del brazo hacia la cámara hace que el pivote
// principal (y=0) sea la mano/muñeca que vemos de cerca, y y=-1.0 sea el hombro.

// Piel del brazo (amarillo Homero, cubre la mano y antebrazo)
const skinGeo = new THREE.BoxGeometry(0.25, 0.6, 0.45);
const skinMat = new THREE.MeshLambertMaterial({ map: createTexture('skin') });
const skinMesh = new THREE.Mesh(skinGeo, skinMat);
skinMesh.position.set(0, -0.3, 0);

// Manga de la camiseta (blanca, llega un poco antes del codo)
const sleeveGeo = new THREE.BoxGeometry(0.255, 0.4, 0.455); 
const sleeveMat = new THREE.MeshLambertMaterial({ map: createTexture('sleeve') });
const sleeveMesh = new THREE.Mesh(sleeveGeo, sleeveMat);
sleeveMesh.position.set(0, -0.8, 0);

armGroup.add(skinMesh);
armGroup.add(sleeveMesh);

armGroup.position.set(0.65, -0.2, -0.7);
armGroup.rotation.set(-Math.PI / 6, -Math.PI / 8, 0);

camera.add(armGroup);

// --- BLOQUE EN LA MANO ---
const handBlockGroup = new THREE.Group();
const handBlockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), new THREE.MeshLambertMaterial({color: 0xffffff}));
handBlockMesh.material.transparent = true;
handBlockGroup.add(handBlockMesh);
handBlockGroup.position.set(0.9, -0.65, -0.9); // Más a la derecha
handBlockGroup.rotation.set(0.1, Math.PI / 4, 0); 
handBlockGroup.visible = false;
camera.add(handBlockGroup);

// --- OUTLINE DE SELECCION (Bordes del bloque) ---
const selectionMat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true, opacity: 0.4 });
const selectionMesh = new THREE.Mesh(new THREE.BoxGeometry(1.01, 1.01, 1.01), selectionMat);
selectionMesh.visible = false;
scene.add(selectionMesh);

scene.add(camera);

let isSwinging = false;
let swingTime = 0;

function triggerArmSwing() {
    isSwinging = true;
    swingTime = 0;
}

// ==========================================
// GENERACIÃ“N PROCEDIMENTAL Y MAPA DE ALTURAS
// ==========================================
function getH(x, z) {
    // Más relieve y un 20% más montañas, casi nada de agua (solo en pozos profundos)
    let h = Math.sin(x * 0.04 + SEED) * Math.cos(z * 0.04 + SEED) * 9; 
    h += Math.sin(x * 0.12 + SEED) * 2.5;
    h += 6; // OFFSET alto para eliminar agua en la mayoría del mapa
    
    // Zonas de montaña (reagregadas un 20%)
    if (h > 10) {
        h = 10 + (h - 10) * 1.6; 
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
// MOTOR DE FÃSICAS Y COLISIONES AABB
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
// GESTIÃ“N DE CHUNKS (GeneraciÃ³n infinita)
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

                // Relleno hacia abajo para evitar vacÃ­os
                if (h > hn + 1 && baseH === h) {
                    for (let y = h - 1; y >= hn; y--) {
                        dummy.position.set(x, y, z);
                        dummy.updateMatrix();
                        if (!pools['stone']) pools['stone'] = [];
                        pools['stone'].push(dummy.matrix.clone());
                    }
                }

                // GeneraciÃ³n de Agua (Solo si h es muy bajo)
                if (h < 0) {
                    dummy.position.set(x, 0.4, z);
                    dummy.updateMatrix();
                    if (!pools['water']) pools['water'] = [];
                    pools['water'].push(dummy.matrix.clone());
                }

                // Generación de Árboles (1.5% chance)
                if (type === 'grass' && h === baseH && h > 1) {
                    const noise = Math.sin(wx * 123.45) * Math.cos(wz * 678.9);
                    if (noise > 0.97) {
                        this.spawnTree(x, h + 1, z, pools);
                    }
                }
            }
        }

        // Ensamblar las geometrías instanciadas del terreno
        for (const k in pools) {
            const mat = blockMaterials[k];
            const geom = (k === 'water') ? waterGeom : boxGeom;
            const m = new THREE.InstancedMesh(geom, mat, pools[k].length);
            m.userData.type = k;
            
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

    spawnTree(tx, ty, tz, pools) {
        const h = 3 + Math.floor(Math.random() * 2);
        for (let y = 0; y < h; y++) {
            dummy.position.set(tx, ty + y, tz);
            dummy.updateMatrix();
            if (!pools['wood']) pools['wood'] = [];
            pools['wood'].push(dummy.matrix.clone());
        }
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = 0; dy <= 2; dy++) {
                for (let dz = -2; dz <= 2; dz++) {
                    if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 4) continue;
                    dummy.position.set(tx + dx, ty + h + dy - 1, tz + dz);
                    dummy.updateMatrix();
                    if (!pools['leaves']) pools['leaves'] = [];
                    pools['leaves'].push(dummy.matrix.clone());
                }
            }
        }
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
let currentSlotIdx = 0;
let selectedType = null;

// --- SISTEMA DE MINADO CONTINUO ---
let isMining = false;
let mineTimer = 0;
let mineTargetPos = null;
const miningTimes = { snow: 1.0, dirt: 1.0, grass: 1.0, sand: 1.0, wood: 2.5, leaves: 0.7, stone: 8.0, water: Infinity };

const crackTextures = [];
for (let i = 0; i <= 5; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    const drawCrack = (x, y) => ctx.fillRect(x, y, 1, 1);
    if (i > 0) { drawCrack(8,8); drawCrack(7,7); drawCrack(8,7); }
    if (i > 1) { drawCrack(6,6); drawCrack(9,8); drawCrack(7,9); drawCrack(9,7); }
    if (i > 2) { drawCrack(5,5); drawCrack(6,10); drawCrack(10,8); drawCrack(10,6); drawCrack(6,5); }
    if (i > 3) { drawCrack(4,4); drawCrack(11,9); drawCrack(11,5); drawCrack(5,11); drawCrack(7,11); drawCrack(4,6); }
    if (i > 4) { drawCrack(3,3); drawCrack(2,2); drawCrack(12,10); drawCrack(13,11); drawCrack(12,4); drawCrack(4,12); drawCrack(8,12); drawCrack(8,13); drawCrack(3,7); }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
    crackTextures.push(tex);
}

const crackMat = new THREE.MeshBasicMaterial({ 
    transparent: true, map: crackTextures[0], depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 
});
const crackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.02, 1.02), crackMat);
crackMesh.visible = false;
scene.add(crackMesh);

// --- SISTEMA DE DROPS MAGNETIZADOS ---
const drops = [];
function spawnDrop(x, y, z, blockType) {
    if(!blockMaterials[blockType]) blockType = 'stone';
    const mat = Array.isArray(blockMaterials[blockType]) ? blockMaterials[blockType][0] : blockMaterials[blockType]; 
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), mat);
    mesh.position.set(x, y, z);
    mesh.userData = { type: blockType, age: 0, vx: (Math.random() - 0.5) * 3, vy: 4, vz: (Math.random() - 0.5) * 3 };
    scene.add(mesh);
    drops.push(mesh);
}

function getTargetBlockInfo() {
    raycaster.setFromCamera(screenCenter, camera);
    const hits = raycaster.intersectObjects(interactables, false);
    if (!hits.length || hits[0].distance > 7) return null;
    const hit = hits[0];
    
    let px, py, pz, type;
    if (hit.object.isInstancedMesh && hit.instanceId !== undefined) {
        const matrix = new THREE.Matrix4();
        hit.object.getMatrixAt(hit.instanceId, matrix);
        const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
        hit.object.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), new THREE.Vector3());
        pos.applyMatrix4(hit.object.matrixWorld);
        px = Math.round(pos.x); py = Math.round(pos.y); pz = Math.round(pos.z);
        type = hit.object.userData.type || 'grass';
    } else if (hit.object.userData.isPlaced) {
        const pos = hit.object.position;
        px = Math.round(pos.x); py = Math.round(pos.y); pz = Math.round(pos.z);
        type = hit.object.userData.type || 'grass';
    } else {
        return null;
    }
    return { hit, px, py, pz, type };
}

function breakBlockNow(info) {
    if (info.hit.object.isInstancedMesh && info.hit.instanceId !== undefined) {
        const matrix = new THREE.Matrix4();
        matrix.makeTranslation(0, -9999, 0); // Enviar al vacío para que el Raycast no lo detecte
        info.hit.object.setMatrixAt(info.hit.instanceId, matrix);
        info.hit.object.instanceMatrix.needsUpdate = true;
    } else if (info.hit.object.userData.isPlaced) {
        scene.remove(info.hit.object);
        const idx = interactables.indexOf(info.hit.object);
        if (idx > -1) interactables.splice(idx, 1);
    }
    // Marcar como aire en heightEdits para no regenerarlo
    heightEdits.set(`${info.px},${info.pz}`, info.py - 1);
    spawnDrop(info.px, info.py, info.pz, info.type);
}

// --- SISTEMA DE INVENTARIO ---
const inventory = new Array(36).fill(null).map(() => ({ type: null, count: 0 }));
const iconCache = {};

function updateInventoryUI() {
    for (let i = 0; i < 36; i++) {
        const slot = inventory[i];
        const slotEl = document.getElementById(`slot-${i}`);
        const hudSlotEl = document.getElementById(`hud-slot-${i}`);
        
        const updateEl = (el) => {
            if (!el) return;
            el.innerHTML = '';
            if (slot.type && slot.count > 0) {
                const img = document.createElement('img');
                img.src = getBlockIcon(slot.type);
                el.appendChild(img);
                if (slot.count > 1) {
                    const countEl = document.createElement('div');
                    countEl.className = 'slot-count';
                    countEl.innerText = slot.count;
                    el.appendChild(countEl);
                }
            }
        };
        
        updateEl(slotEl);
        if (i < 9) updateEl(hudSlotEl);
    }
    // Actualizar slots de armadura
    for (let i = 0; i < 4; i++) {
        updateSlotEl(document.getElementById(`armor-${i}`), armorSlots[i]);
    }
    // Actualizar slots de crafteo
    for (let i = 0; i < 4; i++) {
        updateSlotEl(document.getElementById(`craft-${i}`), craftSlots[i]);
    }
    updateSlotEl(document.getElementById('craft-result'), craftResult);
    
    // Actualizar mesa de crafteo 3x3
    for (let i = 0; i < 9; i++) {
        updateSlotEl(document.getElementById(`table-${i}`), tableSlots[i]);
    }
    updateSlotEl(document.getElementById('table-result'), tableResult);
    
    // Mostrar item "agarrado" siguiendo al mouse
    const pickedEl = document.getElementById('picked-item');
    if (pickedItem && pickedItem.count > 0) {
        pickedEl.style.display = 'block';
        pickedEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = getBlockIcon(pickedItem.type);
        pickedEl.appendChild(img);
        if (pickedItem.count > 1) {
            const c = document.createElement('div');
            c.className = 'slot-count';
            c.innerText = pickedItem.count;
            pickedEl.appendChild(c);
        }
    } else {
        pickedEl.style.display = 'none';
    }
}

function updateSlotEl(el, slotData) {
    if (!el) return;
    el.innerHTML = '';
    if (slotData && slotData.type && slotData.count > 0) {
        const img = document.createElement('img');
        img.src = getBlockIcon(slotData.type);
        el.appendChild(img);
        if (slotData.count > 1) {
            const countEl = document.createElement('div');
            countEl.className = 'slot-count';
            countEl.innerText = slotData.count;
            el.appendChild(countEl);
        }
    }
}

const pickedItem = { type: null, count: 0 };
const armorSlots = new Array(4).fill(null).map(() => ({ type: null, count: 0 }));
const craftSlots = [{type:null,count:0},{type:null,count:0},{type:null,count:0},{type:null,count:0}];
const tableSlots = new Array(9).fill(null).map(() => ({ type: null, count: 0 }));
let craftResult = { type: null, count: 0 };
let tableResult = { type: null, count: 0 };
let isCraftingTableActive = false;

function toggleInventory(open, asTable = false) {
    isUIOpen = open;
    isCraftingTableActive = asTable;
    overlayDOM.classList.toggle('hidden', !open);
    
    const standard = document.getElementById('inv-top-standard');
    const table = document.getElementById('inv-top-crafting');
    if (standard && table) {
        standard.classList.toggle('hidden', asTable);
        table.classList.toggle('hidden', !asTable);
    }
    
    if (open) {
        document.exitPointerLock();      
        const hud = document.getElementById('hud');
        if(hud) hud.style.display = 'none';
        if (!asTable) uiAnimate(); 
    } else {
        document.body.requestPointerLock();
        const hud = document.getElementById('hud');
        if(hud) hud.style.display = 'block';
    }
    updateInventoryUI();
}

function checkCrafting() {
    // 2x2 Crafting
    let woodIn = 0;
    let anyWood = false;
    craftSlots.forEach(s => { if(s.type === 'wood' && s.count > 0) { anyWood = true; woodIn += s.count; } });
    const isFullPlanks = craftSlots.every(s => s.type === 'planks' && s.count > 0);

    if (isFullPlanks) { craftResult.type = 'crafting_table'; craftResult.count = 1; }
    else if (anyWood) { craftResult.type = 'planks'; craftResult.count = 4; }
    else { craftResult.type = null; craftResult.count = 0; }

    // 3x3 Table Crafting (Plank square -> Table)
    let planksCount = 0;
    tableSlots.forEach(s => { if(s.type === 'planks' && s.count > 0) planksCount++; });
    if (planksCount === 4 && tableSlots[0].type === 'planks' && tableSlots[1].type === 'planks' && tableSlots[3].type === 'planks' && tableSlots[4].type === 'planks') {
        tableResult.type = 'crafting_table'; tableResult.count = 1;
    } else if (tableSlots.some(s => s.type === 'wood' && s.count > 0)) {
        // En la mesa también se puede procesar madera
        tableResult.type = 'planks'; tableResult.count = 4;
    } else {
        tableResult.type = null; tableResult.count = 0;
    }
}

let isRightDown = false;
document.addEventListener('mousedown', (e) => { if(e.button === 2) isRightDown = true; });
document.addEventListener('mouseup', (e) => { if(e.button === 2) isRightDown = false; });

function handleSlotEnter(type, index) {
    if (isUIOpen && isRightDown && pickedItem.type) {
        let target = null;
        if (type === 'inv') target = inventory[index];
        else if (type === 'craft') target = craftSlots[index];
        else if (type === 'armor') target = armorSlots[index];
        else if (type === 'table') target = tableSlots[index];
        
        if (target && (!target.type || target.type === pickedItem.type) && target.count < 64) {
            target.type = pickedItem.type;
            target.count++;
            pickedItem.count--;
            if (pickedItem.count <= 0) pickedItem.type = null;
            checkCrafting();
            updateInventoryUI();
        }
    }
}

function handleSlotClick(e, type, index) {
    if (e) e.preventDefault();
    const isRightClick = e && e.button === 2;
    
    let target = null;
    let resultRef = null;
    let gridRef = null;

    if (type === 'inv') target = inventory[index];
    else if (type === 'craft') target = craftSlots[index];
    else if (type === 'table') target = tableSlots[index];
    else if (type === 'armor') target = armorSlots[index];
    else if (type === 'result') { target = { type: null, count: 0 }; resultRef = craftResult; gridRef = craftSlots; }
    else if (type === 'table-result') { target = { type: null, count: 0 }; resultRef = tableResult; gridRef = tableSlots; }

    if (resultRef) {
        if (resultRef.type && (!pickedItem.type || pickedItem.type === resultRef.type)) {
            if (!pickedItem.type) pickedItem.type = resultRef.type;
            if (pickedItem.count + resultRef.count <= 64) {
                pickedItem.count += resultRef.count;
                gridRef.forEach(s => { if (s.count > 0) { s.count--; if (s.count === 0) s.type = null; } });
                checkCrafting();
                updateInventoryUI();
            }
        }
        return;
    }

    if (!pickedItem.type && target.type) {
        if (isRightClick && target.count > 1) {
            // Recoger MITAD (Click derecho)
            const half = Math.ceil(target.count / 2);
            pickedItem.type = target.type;
            pickedItem.count = half;
            target.count -= half;
        } else {
            // Recoger TODO (Click izquierdo o solo 1 item)
            pickedItem.type = target.type;
            pickedItem.count = target.count;
            target.type = null; target.count = 0;
        }
    } else if (pickedItem.type && !target.type) {
        if (isRightClick) {
            // Soltar UNO (Click derecho)
            target.type = pickedItem.type;
            target.count = 1;
            pickedItem.count--;
            if (pickedItem.count === 0) pickedItem.type = null;
        } else {
            // Soltar TODO (Click izquierdo)
            target.type = pickedItem.type;
            target.count = pickedItem.count;
            pickedItem.type = null; pickedItem.count = 0;
        }
    } else if (pickedItem.type === target.type) {
        if (isRightClick) {
            // Soltar UNO en stack (Click derecho)
            if (target.count < 64) {
                target.count++;
                pickedItem.count--;
                if (pickedItem.count === 0) pickedItem.type = null;
            }
        } else {
            // Mezclar TODO (Click izquierdo)
            const space = 64 - target.count;
            const toAdd = Math.min(space, pickedItem.count);
            target.count += toAdd;
            pickedItem.count -= toAdd;
            if (pickedItem.count === 0) pickedItem.type = null;
        }
    } else if (pickedItem.type && target.type && !isRightClick) {
        // Intercambiar TODO (Click izquierdo)
        let tmpT = target.type; let tmpC = target.count;
        target.type = pickedItem.type; target.count = pickedItem.count;
        pickedItem.type = tmpT; pickedItem.count = tmpC;
    }
    
    if (type === 'craft') checkCrafting();
    updateInventoryUI();
}
window.handleSlotClick = handleSlotClick;

document.addEventListener('mousemove', (e) => {
    if (isUIOpen) {
        mouseXUI = (e.clientX / window.innerWidth) * 2 - 1;
        mouseYUI = -(e.clientY / window.innerHeight) * 2 + 1;
        
        const pEl = document.getElementById('picked-item');
        if (pEl) {
            pEl.style.left = (e.clientX - 33) + 'px';
            pEl.style.top = (e.clientY - 33) + 'px';
        }
    }
});

function getBlockIcon(type) {
    if (iconCache[type]) return iconCache[type];
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    const ctx = canvas.getContext('2d');
    drawPattern(ctx, type);
    iconCache[type] = canvas.toDataURL();
    return iconCache[type];
}

function addToInventory(type, shouldUpdateUI = true) {
    if (gameMode === 'creative') return true;
    
    // 1. Buscar si ya existe el tipo (stacking)
    for (let i = 0; i < 36; i++) {
        if (inventory[i].type === type && inventory[i].count < 64) {
            inventory[i].count++;
            if (shouldUpdateUI) updateInventoryUI();
            return true;
        }
    }
    
    // 2. Buscar primer slot libre
    for (let i = 0; i < 36; i++) {
        if (!inventory[i].type || inventory[i].count === 0) {
            inventory[i].type = type;
            inventory[i].count = 1;
            if (shouldUpdateUI) updateInventoryUI();
            return true;
        }
    }
    return false;
}

function updateDrops(dt) {
    let changed = false;
    for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        const ud = drop.userData;
        ud.age += dt;
        drop.rotation.y += 2 * dt;
        
        const dist = drop.position.distanceTo(camera.position); 
        if (dist < 3.0 && ud.age > 0.5) { 
            const dir = camera.position.clone().sub(drop.position).normalize();
            drop.position.addScaledVector(dir, 14.0 * dt);
            if (dist < 0.85) {
                // Agregar sin actualizar UI todavía (para optimizar)
                if (addToInventory(ud.type, false)) {
                    scene.remove(drop);
                    drops.splice(i, 1);
                    changed = true;
                }
                continue;
            }
        } else {
            ud.vy -= 15 * dt; 
            drop.position.x += ud.vx * dt;
            drop.position.y += ud.vy * dt;
            drop.position.z += ud.vz * dt;
            
            const floorH = getMapH(drop.position.x, drop.position.z) + 0.125;
            if (drop.position.y <= floorH) {
                drop.position.y = floorH;
                ud.vy = 0;
                ud.vx *= 0.5; ud.vz *= 0.5;
            }
        }
    }
    // Actualizar UI solo una vez si algo cambió
    if (changed) updateInventoryUI();
}

function updateMining(dt) {
    if (!isMining) {
        crackMesh.visible = false;
        mineTargetPos = null;
        return;
    }

    const info = getTargetBlockInfo();
    if (!info) {
        crackMesh.visible = false;
        mineTargetPos = null;
        mineTimer = 0;
        return;
    }

    if (!mineTargetPos || mineTargetPos.x !== info.px || mineTargetPos.y !== info.py || mineTargetPos.z !== info.pz) {
        mineTargetPos = { x: info.px, y: info.py, z: info.pz };
        mineTimer = 0;
    }

    const reqTime = miningTimes[info.type] || 3.0; // Tierra por defecto
    mineTimer += dt;
    
    if (!isSwinging || swingTime > 2.8) triggerArmSwing(); 

    crackMesh.visible = true;
    crackMesh.position.set(info.px, info.py, info.pz);
    const progress = Math.min(mineTimer / reqTime, 1.0);
    
    let stage = Math.floor(progress * 5);
    if(stage > 5) stage = 5;
    crackMat.map = crackTextures[stage];
    crackMat.needsUpdate = true;

    if (mineTimer >= reqTime) {
        breakBlockNow(info);
        mineTimer = 0;
        crackMesh.visible = false;
        mineTargetPos = null;
        triggerArmSwing();
    }
}

document.addEventListener('mousedown', (e) => {
    if (!isLocked) return;
    const info = getTargetBlockInfo();

    if (e.button === 0) {
        isMining = true;
        mineTimer = 0;
    } else if (e.button === 2) {
        if (info && info.type === 'crafting_table') {
            // INTERACCIÓN MESA: Abrir UI
            toggleInventory(true, true);
            return;
        }
        
        const slot = inventory[currentSlotIdx];
        if (!slot || !slot.type || slot.count <= 0) return;

        if (!info) return;
        const hit = info.hit;
        const hitNorm = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
        const normMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
        hitNorm.applyMatrix3(normMatrix).normalize();
        
        const p = hit.point.clone().add(hitNorm.clone().multiplyScalar(0.1));
        const px = Math.round(p.x), py = Math.round(p.y), pz = Math.round(p.z);
        const pCamX = Math.round(camera.position.x), pCamZ = Math.round(camera.position.z);
        
        // No poner bloque en la posicion del jugador
        if (Math.abs(px - pCamX) < 1 && Math.abs(pz - pCamZ) < 1 && py > camera.position.y - 1.8 && py < camera.position.y + 0.5) return;
        
        const bType = slot.type;
        const mat = blockMaterials[bType];
        const mesh = new THREE.Mesh(boxGeom, mat);
        mesh.position.set(px, py, pz);
        mesh.userData.isPlaced = true;
        mesh.userData.type = bType;
        
        scene.add(mesh);
        interactables.push(mesh);
        if (py > getMapH(px, pz)) heightEdits.set(`${px},${pz}`, py);
        
        // Consumir item (solo en supervivencia)
        if (gameMode !== 'creative') {
            slot.count--;
            if (slot.count <= 0) {
                slot.type = null;
                slot.count = 0;
            }
        }
        updateInventoryUI();
        triggerArmSwing();
    }
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        isMining = false;
        mineTimer = 0;
        crackMesh.visible = false;
    }
});

// =============================================================================
let isLocked = false;
let sensX = 1.0;
let sensY = 1.0;

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;

document.addEventListener('pointerlockchange', () => {
    isLocked = (document.pointerLockElement === document.body);
    const pm = document.getElementById('pause-menu');
    const overlay = document.getElementById('inventory-overlay');
    const hud = document.getElementById('hud');
    
    if (isLocked) {
        if(pm) pm.classList.add('hidden');
        // REANUDAR BUCLE SI ESTABA PAUSADO
        if (typeof gameLoopId === 'undefined' || gameLoopId === null) {
            if(typeof pTime !== 'undefined') pTime = performance.now();
            gameLoopId = requestAnimationFrame(animate);
        }
        // Cerrar inventario al reanudar desde el menú
        if (typeof isUIOpen !== 'undefined' && isUIOpen) {
            isUIOpen = false;
            if (overlay) overlay.classList.add('hidden');
            if(hud) hud.style.display = 'block';
        }
    } else {
        if(pm) pm.classList.remove('hidden');
        // PAUSAR BUCLE
        if (typeof gameLoopId !== 'undefined' && gameLoopId !== null) {
            cancelAnimationFrame(gameLoopId);
        }
        gameLoopId = null;
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
// UI INTERFAZ, MENÃšS & EVENTOS GLOBALES
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
    alert("Juego guardado (Demo). Â¡Hasta luego!");
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

document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '9') {
        currentSlotIdx = parseInt(e.key) - 1;
        document.querySelectorAll('.hotbar-slot').forEach(s => s.classList.remove('active'));
        
        // Mark both HUD and Inv slots as active
        const hudSlot = document.getElementById(`hud-slot-${slotIdx}`);
        const invSlot = document.getElementById(`slot-${slotIdx}`);
        if(hudSlot) hudSlot.classList.add('active');
        if(invSlot) invSlot.classList.add('active');
        
        const slot = inventory[currentSlotIdx];
        selectedType = (slot && slot.type && slot.count > 0) ? slot.type : null;
    }
});

// ==========================================
// REGISTRO DE INPUTS FÃSICOS (Teclado)
// ==========================================
let mF = 0, mB = 0, mL = 0, mR = 0, mU = 0, mD = 0;
let spr = 0, lW = 0;
let vel = new THREE.Vector3();
let isFlying = false;
let lastSpaceTime = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === 'F6') {
        e.preventDefault();
        cameraMode = (cameraMode + 1) % 3;
    }
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
// BUCLE PRINCIPAL DE ANIMACIÃ“N Y RENDER
// ==========================================
camera.position.set(0, getMapH(0,0) + PLAYER_HEIGHT + 2, 0);

let pTime = performance.now();
let fC = 0;
let lFps = performance.now();

let gameLoopId;
function animate() {
    gameLoopId = requestAnimationFrame(animate);
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
        updateMining(d);
        updateDrops(d);

        const feetY = camera.position.y - PLAYER_HEIGHT;
        const curSolidY = getFloorHeight(camera.position.x, camera.position.z, feetY);
        const inW = (feetY <= 1.0 && getMapH(camera.position.x, camera.position.z) < 0);
        const headInW = (camera.position.y <= 0.4 && getMapH(camera.position.x, camera.position.z) < 0);

        // Renderizado ambiental condicional (Bajo el agua vs Superficie)
        if (headInW) {
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

        // Efecto de Campo Visual DinÃ¡mico para Sprint
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

        // Traducir Control de CÃ¡mara a Vector FÃ­sico
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

        // Visual Inmersivo del Brazo / Bloque
        const slot = inventory[currentSlotIdx];
        const activeType = (slot && slot.type && slot.count > 0) ? slot.type : null;
        selectedType = activeType;

        // --- ACTUALIZAR OUTLINE DE SELECCION ---
        const selInfo = getTargetBlockInfo();
        if (selInfo && cameraMode === 0) {
            selectionMesh.visible = true;
            selectionMesh.position.set(selInfo.px, selInfo.py, selInfo.pz);
        } else {
            selectionMesh.visible = false;
        }

        if (activeType) {
            armGroup.visible = false;
            handBlockGroup.visible = (cameraMode === 0);
            if (blockDefs[activeType] && blockDefs[activeType].map) {
                handBlockMesh.material.map = blockDefs[activeType].map;
                handBlockMesh.material.color.set(0xffffff);
            } else {
                handBlockMesh.material.map = null;
                handBlockMesh.material.color.set(blockDefs[activeType]?.color || 0x7f8c8d);
            }
            handBlockMesh.material.needsUpdate = true;
        } else {
            armGroup.visible = (cameraMode === 0);
            handBlockGroup.visible = false;
        }

        if (isSwinging) {
            swingTime += d * 9; // Velocidad aumentada a 9
            const swingTarget = activeType ? handBlockGroup : armGroup;
            swingTarget.rotation.x = -Math.PI / 6 - Math.sin(swingTime) * 1.0;
            
            if (swingTime > Math.PI) {
                isSwinging = false;
                swingTarget.rotation.x = -Math.PI / 6;
            }
        } else if (onGround && (vel.x !== 0 || vel.z !== 0) && !isFlying) {
            const swingTarget = activeType ? handBlockGroup : armGroup;
            swingTarget.rotation.x = -Math.PI / 6 + Math.sin(t * 0.012) * 0.08;
            if(!activeType) armGroup.rotation.z = Math.cos(t * 0.006) * 0.04;
        } else {
            const swingTarget = activeType ? handBlockGroup : armGroup;
            swingTarget.rotation.x = THREE.MathUtils.lerp(swingTarget.rotation.x, -Math.PI / 6, 10 * d);
            if(!activeType) armGroup.rotation.z = THREE.MathUtils.lerp(armGroup.rotation.z, 0, 10 * d);
        }

        // Modos de ElevaciÃ³n
        if (!isFlying) {
            if (inW) { // NataciÃ³n
                if (mU) { vel.y += 24 * d; if (feetY > -0.3) vel.y = 6; }
                if (mD) vel.y -= 25 * d;
                vel.y = Math.max(Math.min(vel.y, 6), -4);
            } else if (mU && onGround && vel.y <= 0) {
                vel.y = 8.5; // Salto normal pre-calibrado a 1 bloque
            }
        } else { 
            if (mU) vel.y = 10;
            else if (mD) vel.y = -10;
            else vel.y *= 0.8; // FricciÃ³n al detener impulso de vuelo
        }

        // ResoluciÃ³n de Colisiones X / Z (RevisiÃ³n de paredes)
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

        // Cierre y adaptaciÃ³n sobre terreno
        const finalFloorY = getFloorHeight(camera.position.x, camera.position.z, camera.position.y - PLAYER_HEIGHT);
        
        if (camera.position.y - PLAYER_HEIGHT < finalFloorY) {
            camera.position.y = finalFloorY + PLAYER_HEIGHT;
            vel.y = 0;
            
            if (isFlying) isFlying = false; // Aterrizaje interrumpe vuelo
        }
    }
    
    pTime = t;
    
    if (cameraMode === 0) {
        tpsPlayer.visible = false;
        // armGroup.visible ya se controla arriba segun activeType
        renderer.render(scene, camera);
    } else {
        armGroup.visible = false;
        tpsPlayer.visible = true;

        // Posicionar jugador
        tpsPlayer.position.copy(camera.position);
        tpsPlayer.position.y -= 0.6; // Ajuste altura perfecta para que no traspase el piso

        // Rotación general (seguir el Y de la cámara)
        const camEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        tpsPlayer.rotation.y = camEuler.y + Math.PI; 
        tpsPlayer.userData.pHeadGroup.rotation.x = -camEuler.x;

        // Animaciones caminar
        const pSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
        if (pSpeed > 0.1) {
            const wC = t * 0.015;
            tpsPlayer.userData.pArmL.rotation.x = Math.sin(wC) * 0.6;
            tpsPlayer.userData.pArmR.rotation.x = -Math.sin(wC) * 0.6;
            tpsPlayer.userData.pLegL.rotation.x = -Math.sin(wC) * 0.6;
            tpsPlayer.userData.pLegR.rotation.x = Math.sin(wC) * 0.6;
        } else {
            tpsPlayer.userData.pArmL.rotation.x = 0;
            tpsPlayer.userData.pArmR.rotation.x = 0;
            tpsPlayer.userData.pLegL.rotation.x = 0;
            tpsPlayer.userData.pLegR.rotation.x = 0;
        }
        
        // Animacion ataque
        if (isSwinging) {
            tpsPlayer.userData.pArmR.rotation.x = -Math.PI / 2 + Math.sin(swingTime) * 1.5;
        }

        // Camara pos
        const pitchRotation = new THREE.Matrix4().makeRotationX(camEuler.x);
        const yawRotation = new THREE.Matrix4().makeRotationY(camEuler.y);
        let dist = 4;
        
        // 1: Atrás (mirando adelante), 2: Delante (mirando atrás)
        const dir = new THREE.Vector3(0, 0, cameraMode === 1 ? 1 : -1)
            .applyMatrix4(pitchRotation)
            .applyMatrix4(yawRotation)
            .normalize();

        raycaster.set(camera.position, dir);
        const hits = raycaster.intersectObjects(interactables, false);
        if (hits.length > 0 && hits[0].distance < dist) {
             dist = Math.max(0.5, hits[0].distance - 0.2);
        }

        tpsCamera.position.copy(camera.position).addScaledVector(dir, dist);
        
        // Mover el punto al que mira la cámara ligeramente abajo en modo frontal para ver la cara bien
        const target = camera.position.clone();
        if (cameraMode === 2) target.y -= 0.5;

        tpsCamera.lookAt(target);
        renderer.render(scene, tpsCamera);
    }
}

window.addEventListener('resize', onResize);
function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    tpsCamera.aspect = w / h;
    tpsCamera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
}

// Corregir zoom al entrar en modo pantalla completa
document.addEventListener('fullscreenchange', () => {
    setTimeout(onResize, 100);
});

// El bucle se inicia al final del script

/* =========================================================
   SISTEMA DE INVENTARIO UI: DATOS -> EVENTOS -> DOM
   ========================================================= */

const overlayDOM = document.getElementById('inventory-overlay');
let isUIOpen = false;

// ==========================================
// RENDERIZADOR SECUNDARIO PARA INVENTARIO (3D Preview HOMER)
// ==========================================
const scene2 = new THREE.Scene();
const camera2 = new THREE.PerspectiveCamera(35, 120/150, 0.1, 100);
camera2.position.set(0, -0.1, 4.5);

const light2 = new THREE.DirectionalLight(0xffffff, 1.2);
light2.position.set(2, 5, 3);
scene2.add(light2);
scene2.add(new THREE.AmbientLight(0xffffff, 0.8));

// CreaciÃ³n del personaje (Homer con proporciones de Steve)
const uiPlayer = new THREE.Group();

const matYellow = new THREE.MeshLambertMaterial({color: 0xffd90f});
const matWhite = new THREE.MeshLambertMaterial({color: 0xffffff});
const matBlue = new THREE.MeshLambertMaterial({color: 0x488cf9});
const matBeard = new THREE.MeshLambertMaterial({color: 0xc19a6b});
const matGray = new THREE.MeshLambertMaterial({color: 0x555555});

// Cabeza
const headGroup = new THREE.Group();
const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), matYellow);
const beard = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.52), matBeard);
beard.position.y = -0.15;
headGroup.add(head);
headGroup.add(beard);

// Rostro y pelo
const matBlack = new THREE.MeshLambertMaterial({color: 0x000000});
const uiEyeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.05), matWhite); uiEyeL.position.set(0.12, 0.05, 0.26);
const uiPupilL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), matBlack); uiPupilL.position.set(0.12, 0.05, 0.28);
headGroup.add(uiEyeL); headGroup.add(uiPupilL);
const uiEyeR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.05), matWhite); uiEyeR.position.set(-0.12, 0.05, 0.26);
const uiPupilR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), matBlack); uiPupilR.position.set(-0.12, 0.05, 0.28);
headGroup.add(uiEyeR); headGroup.add(uiPupilR);
const uiHair1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.03), matBlack); uiHair1.position.set(-0.06, 0.28, 0); uiHair1.rotation.z = Math.PI / 8;
const uiHair2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.03), matBlack); uiHair2.position.set(0.06, 0.28, 0); uiHair2.rotation.z = -Math.PI / 8;
headGroup.add(uiHair1); headGroup.add(uiHair2);

headGroup.position.y = 0.625;
uiPlayer.add(headGroup);

// Torso
const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.25), matWhite);
torso.position.y = 0.0;
uiPlayer.add(torso);

// Brazos
const armL = new THREE.Group();
const armLTop = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), matWhite);
armLTop.position.y = 0.25;
const armLBot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), matYellow);
armLBot.position.y = -0.125;
armL.add(armLTop); armL.add(armLBot);
armL.position.set(0.375, 0.125, 0);
uiPlayer.add(armL);

const armR = new THREE.Group();
const armRTop = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), matWhite);
armRTop.position.y = 0.25;
const armRBot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), matYellow);
armRBot.position.y = -0.125;
armR.add(armRTop); armR.add(armRBot);
armR.position.set(-0.375, 0.125, 0);
uiPlayer.add(armR);

// Piernas
const legL = new THREE.Group();
const legLP = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), matBlue);
legLP.position.y = 0.075;
const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.25), matGray);
shoeL.position.y = -0.3;
legL.add(legLP); legL.add(shoeL);
legL.position.set(0.125, -0.75, 0);
uiPlayer.add(legL);

const legR = new THREE.Group();
const legRP = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), matBlue);
legRP.position.y = 0.075;
const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.25), matGray);
shoeR.position.y = -0.3;
legR.add(legRP); legR.add(shoeR);
legR.position.set(-0.125, -0.75, 0);
uiPlayer.add(legR);

uiPlayer.position.set(0, 0, 0);
scene2.add(uiPlayer);

let renderer2 = null;
setTimeout(() => {
    const invPreview = document.getElementById('inv-3d-preview');
    if (invPreview) {
        renderer2 = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer2.setPixelRatio(window.devicePixelRatio);
        renderer2.setSize(198, 264);
        invPreview.appendChild(renderer2.domElement);
    }
}, 300);

let mouseXUI = 0; let mouseYUI = 0;
document.addEventListener('mousemove', (e) => {
    if (isUIOpen) {
        mouseXUI = (e.clientX / window.innerWidth) * 2 - 1;
        mouseYUI = -(e.clientY / window.innerHeight) * 2 + 1;
    }
});

function uiAnimate() {
    if (isUIOpen) {
        requestAnimationFrame(uiAnimate);
        if (renderer2) {
            uiPlayer.rotation.y = -Math.PI / 8 + mouseXUI * 0.8;
            uiPlayer.rotation.x = -mouseYUI * 0.3; // Invertido para que siga al mouse
            renderer2.render(scene2, camera2);
        }
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e') {
        if (!isLocked && !isUIOpen) return;
        toggleInventory(!isUIOpen, false);
    }
});

// ==========================================
// INICIALIZACIÓN FINAL
// ==========================================
// Empezamos con el inventario vacío
updateInventoryUI();
animate();

