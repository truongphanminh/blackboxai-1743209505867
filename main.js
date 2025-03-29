// Khởi tạo renderer
const canvas = document.getElementById('renderCanvas');
const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;

// Tạo scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Thiết lập camera
const camera = new THREE.PerspectiveCamera(
    60, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);
camera.position.set(2, 2, 5);

// Điều khiển camera
const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI;

// Thêm ánh sáng cơ bản
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Thêm vật thể test
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00,
    roughness: 0.1,
    metalness: 0.5
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// GUI điều khiển
const gui = new dat.GUI({ autoPlace: false });
document.getElementById('gui-container').appendChild(gui.domElement);

gui.add(cube.rotation, 'x', 0, Math.PI * 2).name('Rotation X');
gui.add(cube.rotation, 'y', 0, Math.PI * 2).name('Rotation Y');
gui.add(cube.rotation, 'z', 0, Math.PI * 2).name('Rotation Z');
gui.add(material, 'roughness', 0, 1).name('Roughness');
gui.add(material, 'metalness', 0, 1).name('Metalness');

// Vòng lặp render
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    
    // Cập nhật thông số hiệu suất
    document.getElementById('fps').textContent = Math.round(1000 / clock.getDelta());
}
animate();

// Xử lý thay đổi kích thước cửa sổ
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Đồng hồ đo FPS
const clock = new THREE.Clock();