import * as THREE from 'three';
import { math } from './math';
import { bullet } from './bullet';
import { enemy } from './enemy';
import { star } from './star';

export const world = (() => {
    const SEPARATION_DISTANCE = 20;

    // Main game manager
    class WorldManager {
        constructor(params) {
            this.bullets_ = [];
            this.unused_bullets = [];
            this.enemies_ = [];
            this.unused_enemies = [];
            this.enemy_bullets_ = [];
            this.enemy_unused_bullets = [];
            this.stars_ = [];
            this.unused_stars = [];
            this.speed_ = 12;
            this.params_ = params;
            this.score_ = 0.0;
            this.health_ = 100;
            this.scoreText_ = '00000';
            this.time_to_shoot = 0;
            this.separationDistance_ = SEPARATION_DISTANCE;
        }

        GetEnemies() {
            return this.enemies_;
        }

        GetStars() {
            return this.stars_;
        }

        GetEnemyBullets() {
            return this.enemy_bullets_;
        }

        RemoveEnemy(index) {
            if(this.enemies_[index] && this.enemies_[index].mesh)
                this.enemies_[index].mesh.visible = false;
            this.enemies_.splice(index, 1);
        }

        RemoveBullet(index) {
            if(this.bullets_[index] && this.bullets_[index].mesh)
                this.bullets_[index].mesh.visible = false;
            this.bullets_.splice(index, 1);
        }

        RemoveEnemyBullet(index) {
            if(this.enemy_bullets_[index] && this.enemy_bullets_[index].mesh)
                this.enemy_bullets_[index].mesh.visible = false;
            this.enemy_bullets_.splice(index, 1);
        }

        RemoveStar(index) {
            if(this.stars_[index] && this.stars_[index].mesh)
                this.stars_[index].mesh.visible = false;
            this.stars_.splice(index, 1);
        }

        // return the farthest plane from the player
        LastObjectPosition_() {
            if (this.enemies_.length == 0) {
                return 0;
            }
            let max = -10;
            for (let i = 0; i < this.enemies_.length; i++)
                if (this.enemies_[i].position.z > max)
                    max = this.enemies_[i].position.z;
            return max;
        }

        // spawn a new bullet at the enemy position
        SpawnEnemyBullet_(scale, offset, enemy_position) {
            let obj = null;

            if (this.enemy_unused_bullets.length > 0) {
                obj = this.enemy_unused_bullets.pop();
                obj.mesh.visible = true;
            } else {
                obj = new bullet.Bullet(this.params_);
            }
            obj.position.z = enemy_position.z + offset;
            obj.position.x = enemy_position.x;
            obj.position.y = 0.75;
            obj.scale = scale;
            obj.speed_ = -1 * Math.abs(obj.speed_);
            this.enemy_bullets_.push(obj);
        }

        // spwan enemy plane in one axis randomly (number of planes spawned randomly)
        SpawnEnemies_(plane_position) {
            const numObjects = math.rand_int(1, 2);
            let x_done = new Array(5).fill(false);
            let possible_x = [-1.5, -0.75, 0, 0.75, 1.5];
            let x_index;
            for (let i = 0; i < numObjects; ++i) {
                let obj = null;

                if (this.unused_enemies.length > 0) {
                    obj = this.unused_enemies.pop();
                    obj.mesh.visible = true;
                } else {
                    obj = new enemy.Enemy(this.params_);
                }

                this.separationDistance_ = math.rand_range(
                    SEPARATION_DISTANCE,
                    SEPARATION_DISTANCE * 1.5
                );
                obj.position.z = plane_position.z + this.separationDistance_;

                do {
                    x_index = math.rand_int(0, 4);
                } while (x_done[x_index] == true);
                x_done[x_index] = true;
                obj.position.x = possible_x[x_index];
                obj.position.y = 0.75;
                this.enemies_.push(obj);
            }
        }

        // spawn the bullet of the hero plane
        SpawnBullet_(scale, offset, plane_position) {
            let obj = null;

            if (this.unused_bullets.length > 0) {
                obj = this.unused_bullets.pop();
                obj.mesh.visible = true;
            } else {
                obj = new bullet.Bullet(this.params_);
            }

            obj.position.z = plane_position.z + offset;
            obj.position.x = plane_position.x;
            obj.position.y = 0.75;
            obj.scale = scale;
            this.bullets_.push(obj);
        }

        // spawn a star at the position of the enemy which just died
        SpawnStar_(scale, offset, enemy_position) {
            let obj = null;

            if (this.unused_stars.length > 0) {
                obj = this.unused_stars.pop();
                obj.mesh.visible = true;
            } else {
                obj = new star.Star(this.params_);
            }

            obj.position.z = enemy_position.z + offset;
            obj.position.x = enemy_position.x;
            obj.position.y = 0.65;
            obj.scale = scale;
            this.stars_.push(obj);
        }

        // check if a enemy plane should spawn to reduce crowding
        MaybeSpawn_(plane_position) {
            const farthest = this.LastObjectPosition_();
            if (farthest < SEPARATION_DISTANCE) {
                this.SpawnEnemies_(plane_position);
            }
        }

        // find the closest enemy to the plane and make him shoot a bullet
        FindClosestEnemy_(plane_position) {
            if (this.enemies_.length == 0) {
                return;
            }
            let min = 1000;
            let index = -1;
            for (let i = 0; i < this.enemies_.length; i++)
                if (this.enemies_[i].position.z < min)
                    if (
                        Math.abs(
                            this.enemies_[i].position.x - plane_position.x
                        ) < 0.25
                    ) {
                        min = this.enemies_[i].position.z;
                        index = i;
                    }
            if (index != -1) {
                this.SpawnEnemyBullet_(
                    0.01,
                    -0.1,
                    this.enemies_[index].position
                );
            }
        }

        // all enemy planes follow the hero plane
        FollowPlayer(plane_position) {
            let direction;
            for (let i = 0; i < this.enemies_.length; i++) {
                if (this.enemies_[i].position.z > plane_position.z) {
                    direction = new THREE.Vector3(
                        plane_position.x - this.enemies_[i].position.x,
                        0,
                        -5
                    );
                    direction = direction.normalize();
                    this.enemies_[i].direction = direction;
                }
            }
        }

        // check if plane's bullet hits an enemy plane
        CheckBulletEnemyCollision() {
            let enemies_to_remove = [];
            let bullets_to_remove = [];
            for (let i = 0; i < this.bullets_.length; i++) {
                for (let j = 0; j < this.enemies_.length; j++) {
                    const enemy_check = this.enemies_[j].enemy_box;
                    if (
                        enemy_check.intersectsBox(this.bullets_[i].bullet_box)
                    ) {
                        enemies_to_remove.push(j);
                        bullets_to_remove.push(i);
                    }
                }
            }
            for (let i of enemies_to_remove) {
                if (this.enemies_[i])
                    this.SpawnStar_(0.01, 0.0, this.enemies_[i].position);
                    this.RemoveEnemy(i);
            }
            for (let i of bullets_to_remove) this.RemoveBullet(i);
        }

        // call all the above functions on appropiate conditions
        Update(timeElapsed, plane_position) {
            this.time_to_shoot += timeElapsed;
            this.MaybeSpawn_(plane_position);
            this.FollowPlayer(plane_position);
            this.UpdateScore_(timeElapsed);
            this.CheckBulletEnemyCollision();
            if (this.time_to_shoot > 0.5) {
                this.time_to_shoot = 0;
                this.FindClosestEnemy_(plane_position);
            }
            this.UpdateBullets_(timeElapsed);
            this.UpdateEnemies_(timeElapsed);
            this.UpdateStars_(timeElapsed);
            this.UpdateEnemyBullets_(timeElapsed);
        }

        // update score and health text on screen
        UpdateScore_(timeElapsed) {
            this.score_ += timeElapsed * 10.0;

            const scoreText = Math.round(this.score_).toLocaleString('en-US', {
                minimumIntegerDigits: 5,
                useGrouping: false,
            });
            if (this.health_ < 0) this.health_ = 0;
            const HealthText = this.health_.toLocaleString('en-US');

            if (scoreText == this.scoreText_) {
                return;
            }

            document.getElementById('score-text').innerText = scoreText;
            document.getElementById('health-text').innerText = HealthText;
        }

        // update enemies position and remove the planes that are behind the camera
        UpdateEnemies_(timeElapsed) {
            const invisible = [];
            const visible = [];

            for (let obj of this.enemies_) {
                obj.position.x += 2 * timeElapsed * obj.direction.x;
                obj.position.z += 5 * timeElapsed * obj.direction.z;

                if (obj.position.z < -20) {
                    invisible.push(obj);
                    obj.mesh.visible = false;
                } else {
                    visible.push(obj);
                }

                obj.Update(timeElapsed);
            }

            this.enemies_ = visible;
            this.unused_enemies.push(...invisible);
        }

        // update stars position and remove stars behind the camera
        UpdateStars_(timeElapsed) {
            const invisible = [];
            const visible = [];

            for (let obj of this.stars_) {
                obj.position.z -= timeElapsed * obj.speed_;

                if (obj.position.z < -20) {
                    invisible.push(obj);
                    obj.mesh.visible = false;
                } else {
                    visible.push(obj);
                }

                obj.Update(timeElapsed);
            }

            this.stars_ = visible;
            this.unused_stars.push(...invisible);
        }

        // update enemy bullets position and remove enemy bullets behind the camera
        UpdateEnemyBullets_(timeElapsed) {
            const invisible = [];
            const visible = [];

            for (let obj of this.enemy_bullets_) {
                obj.position.z += timeElapsed * obj.speed_;

                if (obj.position.z < -20) {
                    invisible.push(obj);
                    obj.mesh.visible = false;
                } else {
                    visible.push(obj);
                }

                obj.Update(timeElapsed);
            }

            this.enemy_bullets_ = visible;
            this.enemy_unused_bullets.push(...invisible);
        }

        // update player's bullets position and remove player's bullets which are too away from the camera
        UpdateBullets_(timeElapsed) {
            const invisible = [];
            const visible = [];

            for (let obj of this.bullets_) {
                obj.position.z += timeElapsed * obj.speed_;

                if (obj.position.z > 30) {
                    invisible.push(obj);
                    obj.mesh.visible = false;
                } else {
                    visible.push(obj);
                }

                obj.Update(timeElapsed);
            }

            this.bullets_ = visible;
            this.unused_bullets.push(...invisible);
        }
    }

    return {
        WorldManager: WorldManager,
    };
})();
