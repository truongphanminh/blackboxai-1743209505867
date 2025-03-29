// Worker xử lý ray tracing
self.onmessage = function(e) {
  const { scene, camera, width, height, startRow, endRow, maxDepth, samplesPerPixel } = e.data;
  
  // Khởi tạo camera từ dữ liệu serialized
  const cameraObj = new THREE.PerspectiveCamera(
    camera.fov, 
    camera.aspect, 
    camera.near, 
    camera.far
  );
  cameraObj.position.fromArray(camera.position);
  cameraObj.rotation.fromArray(camera.rotation);
  
  // Khởi tạo scene từ dữ liệu serialized
  const sceneObj = new THREE.Scene();
  // (Sẽ thêm chi tiết sau khi có scene.js)
  
  // Tạo buffer cho kết quả
  const rowCount = endRow - startRow;
  const imageData = new Uint8Array(width * rowCount * 4);
  
  // Ray tracing từng pixel
  for (let y = startRow; y < endRow; y++) {
    for (let x = 0; x < width; x++) {
      let color = new THREE.Color(0, 0, 0);
      
      // Lấy mẫu anti-aliasing
      for (let s = 0; s < samplesPerPixel; s++) {
        const u = (x + Math.random()) / width;
        const v = 1.0 - (y + Math.random()) / height;
        
        const ray = this.generateRay(cameraObj, u, v);
        color.add(this.traceRay(ray, sceneObj, maxDepth));
      }
      
      color.multiplyScalar(1.0 / samplesPerPixel);
      
      // Lưu kết quả vào buffer
      const idx = ((y - startRow) * width + x) * 4;
      imageData[idx] = Math.floor(color.r * 255);
      imageData[idx + 1] = Math.floor(color.g * 255);
      imageData[idx + 2] = Math.floor(color.b * 255);
      imageData[idx + 3] = 255; // Alpha
    }
  }
  
  // Gửi kết quả về main thread
  self.postMessage({
    startRow,
    endRow,
    imageData
  });
};

// Tạo ray từ camera
function generateRay(camera, u, v) {
  const ray = new THREE.Ray();
  const origin = camera.position.clone();
  
  // Tính toán hướng ray
  const x = (2 * u - 1) * Math.tan(camera.fov * Math.PI / 360) * camera.aspect;
  const y = (2 * v - 1) * Math.tan(camera.fov * Math.PI / 360);
  const direction = new THREE.Vector3(x, y, -1)
    .normalize()
    .applyQuaternion(camera.quaternion);
  
  ray.set(origin, direction);
  return ray;
}

// Hàm chính trace ray
function traceRay(ray, scene, depth) {
  if (depth <= 0) return new THREE.Color(0, 0, 0);
  
  const hit = this.intersectScene(ray, scene);
  if (!hit) return new THREE.Color(0.2, 0.2, 0.2); // Màu nền
  
  // Tính toán lighting
  const material = hit.object.material;
  let color = new THREE.Color();
  
  // (Sẽ thêm chi tiết sau khi có materials.js)
  
  return color;
}

// Kiểm tra giao cắt ray với scene
function intersectScene(ray, scene) {
  let closestHit = null;
  let closestDistance = Infinity;
  
  // (Sẽ thêm chi tiết sau khi có scene.js)
  
  return closestHit;
}