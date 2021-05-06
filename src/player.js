import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const player = (() => {
    // main hero player
    class Player {
        constructor(params) {
            this.velocity_ = 0.0;
            this.position = new THREE.Vector3(0, 0.5, 0);
            this.quaternion = new THREE.Quaternion();
            this.playerBox_ = new THREE.Box3();
            this.bullet_created = false;
            this.params_ = params;

            this.LoadModel_();
            this.InitInput_();
        }

        // loading model
        LoadModel_() {
            let Loader = new GLTFLoader();

            Loader.load('/models/Plane/plane_final.glb', gltf => {
                this.mesh = gltf.scene;
                this.mesh.scale.setScalar(0.2);
                this.quaternion.setFromAxisAngle(
                    new THREE.Vector3(0, 1, 0),
                    Math.PI * 1.0
                );
                this.params_.scene.add(this.mesh);

                // adding animations
                const m = new THREE.AnimationMixer(this.mesh);
                this.mixer_ = m;

                for (let i = 0; i < gltf.animations.length; ++i) {
                    const clip = gltf.animations[i];
                    const action = this.mixer_.clipAction(clip);
                    action.play();
                }
            });
        }

        // handling input keys
        InitInput_() {
            this.keys_ = {
                w: false,
                a: false,
                s: false,
                d: false,
            };

            document.addEventListener(
                'keydown',
                e => this.OnKeyDown_(e),
                false
            );
            document.addEventListener('keyup', e => this.OnKeyUp_(e), false);
        }

        OnKeyDown_(event) {
            switch (event.keyCode) {
                case 87:
                case 119:
                    this.keys_.w = true;
                    break;
                case 65:
                case 97:
                    this.keys_.a = true;
                    break;
                case 83:
                case 115:
                    this.keys_.s = true;
                    break;
                case 68:
                case 100:
                    this.keys_.d = true;
                    break;
                case 32:
                    this.keys_.space = true;
                    break;
            }
        }

        OnKeyUp_(event) {
            switch (event.keyCode) {
                case 87:
                case 119:
                    this.keys_.w = false;
                    break;
                case 65:
                case 97:
                    this.keys_.a = false;
                    break;
                case 83:
                case 115:
                    this.keys_.s = false;
                    break;
                case 68:
                case 100:
                    this.keys_.d = false;
                    break;
                case 32:
                    this.keys_.space = false;
                    this.bullet_created = false;
                    break;
            }
        }

        // check for collisions between enemies/enemies bullet with the player
        CheckCollisions_() {
            const enemies = this.params_.world.GetEnemies();
            const enemy_bullets = this.params_.world.GetEnemyBullets();

            this.playerBox_.setFromObject(this.mesh);

            for (let i = 0; i < enemies.length; i++) {
                const cur = enemies[i].enemy_box;

                if (cur.intersectsBox(this.playerBox_)) {
                    this.params_.world.RemoveEnemy(i);
                    this.params_.world.health_ -= 25;
                }
            }

            for (let i = 0; i < enemy_bullets.length; i++) {
                const cur = enemy_bullets[i].bullet_box;

                if (cur.intersectsBox(this.playerBox_)) {
                    this.params_.world.RemoveEnemyBullet(i);
                    this.params_.world.health_ -= 10;
                }
            }
        }

        // Collision detection to increase score when stars are collected
        CollectStars_() {
            const stars = this.params_.world.GetStars();

            this.playerBox_.setFromObject(this.mesh);

            for (let i = 0; i < stars.length; i++) {
                const cur = stars[i].star_box;

                if (cur.intersectsBox(this.playerBox_)) {
                    this.params_.world.RemoveStar(i);
                    this.params_.world.score_ += 50
                }
            }
        }

        // Update function to change postion of the player/ spwan bullets/ check collisions calls, game over check
        Update(timeElapsed) {
            if (!this.mesh) return;
            if (this.keys_.w && this.position.z <= 3) {
                this.position.z += 0.25;
            }
            if (this.keys_.s && this.position.z >= -1) {
                this.position.z -= 0.15;
            }
            if (this.keys_.a && this.position.x <= 1.5) {
                this.position.x += 0.15;
            }
            if (this.keys_.d && this.position.x >= -1.5) {
                this.position.x -= 0.15;
            }
            this.mesh.position.copy(this.position);
            if (this.keys_.space && !this.bullet_created) {
                this.bullet_created = true;
                this.params_.world.SpawnBullet_(0.01, 0.1, this.position);
            }
            this.mesh.quaternion.copy(this.quaternion);
            this.mixer_.update(timeElapsed); 
            this.CheckCollisions_();
            this.CollectStars_();
            if(this.params_.world.health_ <= 0) {
                this.gameOver = true;
            }
        }
    }

    return {
        Player: Player,
    };
})();
