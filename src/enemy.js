import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const enemy = (() => {
    class Enemy {
        constructor(params) {
            this.position = new THREE.Vector3();
            this.quaternion = new THREE.Quaternion();
            this.enemy_box = new THREE.Box3();
            this.direction = new THREE.Vector3(0, 0, -5);

            this.params_ = params;
            this.LoadModel_();
        }

        // load enemy plane model
        LoadModel_() {
            let Loader = new GLTFLoader();

            Loader.load('/models/Plane/enemy_final.glb', gltf => {
                this.mesh = gltf.scene;
                this.mesh.scale.setScalar(0.15);
                this.quaternion.setFromAxisAngle(
                    new THREE.Vector3(0, 1, 0),
                    Math.PI * 0.0
                );
                this.params_.scene.add(this.mesh);

                const m = new THREE.AnimationMixer(this.mesh);
                this.mixer_ = m;

                for (let i = 0; i < gltf.animations.length; ++i) {
                    const clip = gltf.animations[i];
                    const action = this.mixer_.clipAction(clip);
                    action.play();
                }
            });
        }

        // update enemy plane mesh
        UpdateCollider_() {
            this.enemy_box.setFromObject(this.mesh);
        }

        // update enemy plane position, rotation etc
        Update(timeElapsed) {
            if (!this.mesh) {
                return;
            }
            this.mesh.position.copy(this.position);
            this.mesh.quaternion.copy(this.quaternion);
            this.mixer_.update(timeElapsed); 
            this.UpdateCollider_();
        }
    }
    return {
        Enemy: Enemy,
    };
})();
