class RayTracer {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.maxDepth = 5; // Độ sâu tối đa cho ray tracing
    this.samplesPerPixel = 4; // Mẫu mỗi pixel (anti-aliasing)
    this.width = canvas.width;
    this.height = canvas.height;
    this.imageData = new Uint8Array(this.width * this.height * 4);
  }

  // Hàm chính để render scene bằng ray tracing
  render() {
    const startTime = performance.now();
    
    // Tạo worker cho multi-threading
    const workerCount = navigator.hardwareConcurrency || 4;
    const workers = [];
    const rowsPerWorker = Math.ceil(this.height / workerCount);
    
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker('rayTracerWorker.js');
      worker.onmessage = (e) => this.handleWorkerMessage(e, i);
      
      const startRow = i * rowsPerWorker;
      const endRow = Math.min(startRow + rowsPerWorker, this.height);
      
      worker.postMessage({
        scene: this.serializeScene(),
        camera: this.serializeCamera(),
        width: this.width,
        height: this.height,
        startRow,
        endRow,
        maxDepth: this.maxDepth,
        samplesPerPixel: this.samplesPerPixel
      });
      
      workers.push(worker);
    }
    
    this.renderTime = performance.now() - startTime;
  }

  // Xử lý kết quả từ worker
  handleWorkerMessage(e, workerId) {
    const { startRow, endRow, imageData } = e.data;
    
    // Cập nhật dữ liệu ảnh
    for (let y = startRow; y < endRow; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        const workerIdx = ((y - startRow) * this.width + x) * 4;
        
        this.imageData[idx] = imageData[workerIdx];
        this.imageData[idx + 1] = imageData[workerIdx + 1];
        this.imageData[idx + 2] = imageData[workerIdx + 2];
        this.imageData[idx + 3] = 255; // Alpha
      }
    }
    
    // Cập nhật texture
    this.updateTexture();
  }

  // Serialize scene để gửi cho worker
  serializeScene() {
    // Triển khai sau khi có scene.js
    return {};
  }

  // Serialize camera
  serializeCamera() {
    return {
      position: this.camera.position.toArray(),
      rotation: this.camera.rotation.toArray(),
      fov: this.camera.fov,
      aspect: this.camera.aspect,
      near: this.camera.near,
      far: this.camera.far
    };
  }

  // Cập nhật texture từ dữ liệu ảnh
  updateTexture() {
    const texture = new THREE.DataTexture(
      this.imageData,
      this.width,
      this.height,
      THREE.RGBAFormat
    );
    texture.needsUpdate = true;
    
    // Tạo plane để hiển thị kết quả
    if (!this.plane) {
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      this.plane = new THREE.Mesh(geometry, material);
      this.scene.add(this.plane);
    } else {
      this.plane.material.map = texture;
    }
  }
}