class SceneManager {
  constructor() {
    this.objects = [];
    this.lights = [];
    this.environment = new THREE.Color(0.1, 0.1, 0.1);
  }

  addObject(object) {
    this.objects.push(object);
  }

  addLight(light) {
    this.lights.push(light);
  }

  intersect(ray) {
    let closestHit = null;
    let closestDistance = Infinity;

    for (const object of this.objects) {
      const hit = this.intersectObject(ray, object);
      if (hit && hit.distance < closestDistance) {
        closestHit = hit;
        closestDistance = hit.distance;
      }
    }

    return closestHit;
  }

  intersectObject(ray, object) {
    if (object.geometry.type === 'Sphere') {
      return this.intersectSphere(ray, object);
    } else if (object.geometry.type === 'Plane') {
      return this.intersectPlane(ray, object);
    } else if (object.geometry.type === 'Box') {
      return this.intersectBox(ray, object);
    }
    return null;
  }

  intersectSphere(ray, sphere) {
    const center = sphere.position;
    const radius = sphere.geometry.parameters.radius;
    
    const oc = ray.origin.clone().sub(center);
    const a = ray.direction.dot(ray.direction);
    const b = 2.0 * oc.dot(ray.direction);
    const c = oc.dot(oc) - radius * radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return null;
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2.0 * a);
    const t2 = (-b + sqrtDiscriminant) / (2.0 * a);

    const t = t1 > 0.001 ? t1 : t2 > 0.001 ? t2 : null;
    if (t === null) return null;

    const point = ray.origin.clone().addScaledVector(ray.direction, t);
    const normal = point.clone().sub(center).normalize();

    return {
      distance: t,
      point,
      normal,
      object: sphere
    };
  }

  intersectPlane(ray, plane) {
    const normal = plane.rotation * new THREE.Vector3(0, 1, 0);
    const denom = normal.dot(ray.direction);
    
    if (Math.abs(denom) > 0.0001) {
      const t = normal.dot(plane.position.clone().sub(ray.origin)) / denom;
      if (t >= 0) {
        const point = ray.origin.clone().addScaledVector(ray.direction, t);
        return {
          distance: t,
          point,
          normal,
          object: plane
        };
      }
    }
    return null;
  }

  intersectBox(ray, box) {
    // Triển khai thuật toán Ray-AABB intersection
    const bounds = {
      min: box.position.clone().sub(box.geometry.parameters),
      max: box.position.clone().add(box.geometry.parameters)
    };

    let tmin = (bounds.min.x - ray.origin.x) / ray.direction.x;
    let tmax = (bounds.max.x - ray.origin.x) / ray.direction.x;

    if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

    let tymin = (bounds.min.y - ray.origin.y) / ray.direction.y;
    let tymax = (bounds.max.y - ray.origin.y) / ray.direction.y;

    if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

    if ((tmin > tymax) || (tymin > tmax)) return null;

    if (tymin > tmin) tmin = tymin;
    if (tymax < tmax) tmax = tymax;

    let tzmin = (bounds.min.z - ray.origin.z) / ray.direction.z;
    let tzmax = (bounds.max.z - ray.origin.z) / ray.direction.z;

    if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

    if ((tmin > tzmax) || (tzmin > tmax)) return null;

    if (tzmin > tmin) tmin = tzmin;
    if (tzmax < tmax) tmax = tzmax;

    if (tmin > 0.001) {
      const point = ray.origin.clone().addScaledVector(ray.direction, tmin);
      
      // Tính toán normal
      const center = box.position;
      const size = box.geometry.parameters;
      const localPoint = point.clone().sub(center);
      const normal = new THREE.Vector3(
        Math.round(localPoint.x / size.x),
        Math.round(localPoint.y / size.y),
        Math.round(localPoint.z / size.z)
      ).normalize();

      return {
        distance: tmin,
        point,
        normal,
        object: box
      };
    }

    return null;
  }

  // Tạo scene mẫu để test
  createTestScene() {
    // Sàn nhà
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.0
      })
    );
    floor.rotation.x = -Math.PI / 2;
    this.addObject(floor);

    // Vật thể test
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.2,
        metalness: 0.8
      })
    );
    sphere.position.set(0, 1, 0);
    this.addObject(sphere);

    // Ánh sáng
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.addLight(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040);
    this.addLight(ambientLight);
  }
}

// Khởi tạo scene mặc định
const sceneManager = new SceneManager();
sceneManager.createTestScene();