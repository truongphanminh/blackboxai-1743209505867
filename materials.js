class Material {
  constructor(options = {}) {
    this.color = options.color || new THREE.Color(0.5, 0.5, 0.5);
    this.roughness = options.roughness || 0.5;
    this.metalness = options.metalness || 0.0;
    this.ior = options.ior || 1.5; // Index of Refraction
    this.specular = options.specular || 0.5;
    this.emission = options.emission || new THREE.Color(0, 0, 0);
    this.transmission = options.transmission || 0.0; // Độ trong suốt
    this.subsurface = options.subsurface || false; // Hiệu ứng subsurface scattering
  }

  // Tính toán màu sắc dựa trên thông số vật liệu
  evaluate(ray, hit, scene, depth) {
    const normal = hit.normal;
    const viewDir = ray.direction.clone().negate();
    
    // Diffuse component
    const diffuse = this.calculateDiffuse(normal, scene);
    
    // Specular component
    const specular = this.calculateSpecular(ray, hit, viewDir, normal, scene);
    
    // Transmission/Refraction
    const transmission = this.calculateTransmission(ray, hit, scene, depth);
    
    // Kết hợp các thành phần
    const finalColor = new THREE.Color()
      .add(diffuse.multiplyScalar(1 - this.metalness))
      .add(specular)
      .add(transmission)
      .add(this.emission);
    
    return finalColor;
  }

  calculateDiffuse(normal, scene) {
    // Tính toán diffuse dùng Lambertian BRDF
    let diffuse = new THREE.Color(0, 0, 0);
    
    // Lấy mẫu các nguồn sáng
    scene.lights.forEach(light => {
      const lightDir = light.position.clone().sub(hit.point).normalize();
      const nDotL = Math.max(0, normal.dot(lightDir));
      
      // Shadow ray
      const shadowRay = new THREE.Ray(hit.point, lightDir);
      const shadowHit = this.intersectScene(shadowRay, scene);
      
      if (!shadowHit || shadowHit.distance > light.position.distanceTo(hit.point)) {
        diffuse.add(this.color.clone().multiply(light.color).multiplyScalar(nDotL));
      }
    });
    
    return diffuse.multiplyScalar(1 / Math.PI);
  }

  calculateSpecular(ray, hit, viewDir, normal, scene) {
    if (this.roughness <= 0) return new THREE.Color(0, 0, 0);
    
    // GGX/Trowbridge-Reitz BRDF
    const halfway = viewDir.clone().add(ray.direction).normalize();
    const nDotH = Math.max(0, normal.dot(halfway));
    const nDotV = Math.max(0, normal.dot(viewDir));
    const nDotL = Math.max(0, normal.dot(ray.direction));
    
    const alpha = this.roughness * this.roughness;
    const alphaSq = alpha * alpha;
    
    const denom = nDotH * nDotH * (alphaSq - 1.0) + 1.0;
    const D = alphaSq / (Math.PI * denom * denom);
    
    // Fresnel term
    const F0 = new THREE.Color().lerpColors(
      new THREE.Color(0.04, 0.04, 0.04), 
      this.color, 
      this.metalness
    );
    const F = F0.clone().addScaled(
      new THREE.Color(1, 1, 1).sub(F0), 
      Math.pow(1 - nDotV, 5)
    );
    
    return F.multiplyScalar(D * nDotL);
  }

  calculateTransmission(ray, hit, scene, depth) {
    if (this.transmission <= 0 || depth <= 0) return new THREE.Color(0, 0, 0);
    
    // Tính toán refraction
    const normal = hit.normal;
    const n1 = ray.inside ? this.ior : 1.0;
    const n2 = ray.inside ? 1.0 : this.ior;
    const eta = n1 / n2;
    
    const cosThetaI = Math.max(-1, Math.min(1, normal.dot(ray.direction)));
    const sinThetaI = Math.sqrt(1 - cosThetaI * cosThetaI);
    const sinThetaT = eta * sinThetaI;
    
    if (sinThetaT >= 1) {
      // Total internal reflection
      const reflectedDir = ray.direction.clone().reflect(normal);
      const reflectedRay = new THREE.Ray(hit.point, reflectedDir);
      return this.traceRay(reflectedRay, scene, depth - 1);
    }
    
    const cosThetaT = Math.sqrt(1 - sinThetaT * sinThetaT);
    const refractedDir = ray.direction.clone()
      .multiplyScalar(eta)
      .addScaled(normal, eta * cosThetaI - cosThetaT);
    
    const refractedRay = new THREE.Ray(hit.point, refractedDir);
    refractedRay.inside = !ray.inside;
    
    return this.traceRay(refractedRay, scene, depth - 1)
      .multiplyScalar(this.transmission);
  }
}

// Các loại vật liệu định nghĩa sẵn
const Materials = {
  Matte: new Material({
    roughness: 0.9,
    metalness: 0.0
  }),
  
  Glossy: new Material({
    roughness: 0.3,
    metalness: 0.0,
    specular: 0.8
  }),
  
  Metal: new Material({
    roughness: 0.1,
    metalness: 1.0,
    color: new THREE.Color(0.9, 0.9, 0.9)
  }),
  
  Glass: new Material({
    roughness: 0.01,
    metalness: 0.0,
    ior: 1.5,
    transmission: 1.0
  }),
  
  Emissive: new Material({
    emission: new THREE.Color(1, 1, 1),
    roughness: 1.0
  })
};