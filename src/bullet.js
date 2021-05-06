import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const bullet = (() => {
    class Bullet {
        constructor(params) {
            this.position = new THREE.Vector3();
            this.quaternion = new THREE.Quaternion();
            this.bullet_box = new THREE.Box3();
            this.speed_ = 12;

            this.params_ = params;
            this.LoadModel_();
        }

        // load bullet model
        LoadModel_() {
            const geometry = new THREE.SphereGeometry( 0.05, 32, 32 );
            const material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
            this.mesh = new THREE.Mesh( geometry, material );
            // this.mesh.scale()
            this.params_.scene.add( this.mesh );
        }

        // update bullet mesh
        UpdateCollider_() {
            this.bullet_box.setFromObject(this.mesh);
        }

        // update bullet position, rotation etc
        Update(timeElapsed) {
            if (!this.mesh) {
                return;
            }
            this.mesh.position.copy(this.position);
            this.mesh.quaternion.copy(this.quaternion);
            this.UpdateCollider_();
        }
    }
    return {
        Bullet: Bullet,
    };
})();
