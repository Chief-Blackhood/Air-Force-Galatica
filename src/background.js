import * as THREE from 'three';

import {math} from './math.js';

import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';


export const background = (() => {

  // class to add different clouds
  class BackgroundCloud {
    constructor(params) {
      this.params_ = params;
      this.position_ = new THREE.Vector3();
      this.quaternion_ = new THREE.Quaternion();
      this.scale_ = 1.0;
      this.mesh_ = null;

      this.LoadModel_();
    }

    LoadModel_() {
      const loader = new GLTFLoader();
      loader.setPath('/models/GLTF/');
      loader.load('Cloud' + math.rand_int(1, 3) + '.glb', (glb) => {
        this.mesh_ = glb.scene;
        this.params_.scene.add(this.mesh_);

        this.position_.x = math.rand_range(-100, 100);
        this.position_.y = math.rand_range(20, 40);
        this.position_.z = math.rand_range(500, -1000);
        this.scale_ = math.rand_range(5, 10);

        const q = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), math.rand_range(0, 360));
        this.quaternion_.copy(q);

        // loading texture
        this.mesh_.traverse(c => {
          if (c.geometry) {
            c.geometry.computeBoundingBox();
          }

          let materials = c.material;
          if (!(c.material instanceof Array)) {
            materials = [c.material];
          }
  
          for (let m of materials) {
            if (m) {
              m.specular = new THREE.Color(0x000000);
              m.emissive = new THREE.Color(0xC0C0C0);
            }
          }    
          c.castShadow = true;
          c.receiveShadow = true;
        });
      });
    }

    // sending the clouds back in front of the camera if it goes behind it
    Update(timeElapsed) {
      if (!this.mesh_) {
        return;
      }

      this.position_.z -= timeElapsed * 10;
      if (this.position_.z < -100) {
        this.position_.z = math.rand_range(500, 1000);
      }

      this.mesh_.position.copy(this.position_);
      this.mesh_.quaternion.copy(this.quaternion_);
      this.mesh_.scale.setScalar(this.scale_);
    }
  };

  // adding side path objects
  class BackgroundObjects {
    constructor(params) {
      this.params_ = params;
      this.position_ = new THREE.Vector3();
      this.quaternion_ = new THREE.Quaternion();
      this.scale_ = 1.0;
      this.mesh_ = null;

      this.LoadModel_();
    }

    // Randomly loading the models
    LoadModel_() {
      const assets = [
          ['SmallPalmTree.glb', 'PalmTree.png', 3],
          ['BigPalmTree.glb', 'PalmTree.png', 5],
          ['Skull.glb', 'Ground.png', 1],
          ['Pyramid.glb', 'Ground.png', 10],
          ['Monument.glb', 'Ground.png', 10],
          ['Cactus1.glb', 'Ground.png', 5],
          ['Cactus2.glb', 'Ground.png', 5],
          ['Cactus3.glb', 'Ground.png', 5],
      ];
      const [asset, textureName, scale] = assets[math.rand_int(0, assets.length - 1)];

      const texLoader = new THREE.TextureLoader();
      const texture = texLoader.load('/models/textures/' + textureName);
      texture.encoding = THREE.sRGBEncoding;

      const loader = new GLTFLoader();
      loader.setPath('/models/GLTF/');
      loader.load(asset, (glb) => {
        this.mesh_ = glb.scene;
        this.params_.scene.add(this.mesh_);

        this.position_.x = math.rand_range(-200, 200);
        if (this.position_.x < 10 && this.position_.x > -10)
            this.position_.x = -100
        this.position_.z = math.rand_range(500, 100);
        this.position_.y = -10
        this.scale_ = scale;

        const q = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), math.rand_range(0, 360));
        this.quaternion_.copy(q);

        // loading texture
        this.mesh_.traverse(c => {
          let materials = c.material;
          if (!(c.material instanceof Array)) {
            materials = [c.material];
          }
  
          for (let m of materials) {
            if (m) {
              if (texture) {
                m.map = texture;
              }
              m.specular = new THREE.Color(0x000000);
            }
          }    
          c.castShadow = true;
          c.receiveShadow = true;
        });
      });
    }

    // sending the objects back in front of the camera if it goes behind it/ update objects position
    Update(timeElapsed) {
      if (!this.mesh_) {
        return;
      }

      this.position_.z -= timeElapsed * 10;
      if (this.position_.z < -100) {
        this.position_.z = math.rand_range(500, 1000);
      }

      this.mesh_.position.copy(this.position_);
      this.mesh_.quaternion.copy(this.quaternion_);
      this.mesh_.scale.setScalar(this.scale_);
    }
  };

  // Spawns all the background objects and updates them
  class Background {
    constructor(params) {
      this.params_ = params;
      this.clouds_ = [];
      this.objects_ = [];

      this.SpawnClouds_();
      this.SpawnObjects_();
    }

    SpawnClouds_() {
      for (let i = 0; i < 25; ++i) {
        const cloud = new BackgroundCloud(this.params_);

        this.clouds_.push(cloud);
      }
    }

    SpawnObjects_() {
      for (let i = 0; i < 40; ++i) {
        const objects = new BackgroundObjects(this.params_);

        this.objects_.push(objects);
      }
    }

    Update(timeElapsed) {
      for (let cloud of this.clouds_) {
        cloud.Update(timeElapsed);
      }
      for (let objects of this.objects_) {
        objects.Update(timeElapsed);
      }
    }
  }

  return {
      Background: Background,
  };
})();
