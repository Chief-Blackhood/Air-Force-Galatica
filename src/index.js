import * as THREE from 'three';

import { player } from './player.js';
import { world } from './world.js';
import {background} from './background.js';

const _VS = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;

class BasicWorld {
    constructor() {
        this.gameStarted = true;
        this._Initialize();
    }

    _Initialize() {
        // setting up the renderer, camera and lights
        this.renderer_ = new THREE.WebGLRenderer({
            antialias: true,
        });
        this.renderer_.outputEncoding = THREE.sRGBEncoding;
        this.renderer_.gammaFactor = 2.2;
        this.renderer_.setPixelRatio(window.devicePixelRatio);
        this.renderer_.setSize(window.innerWidth, window.innerHeight);

        // an event listener to change size of renderer with window resize
        window.addEventListener(
            'resize',
            () => {
                this.OnWindowResize_();
            },
            false
        );

        const fov = 60;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 1.0;
        const far = 20000.0;

        this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera_.position.set(0, 1.5, -4);
        this.camera_.lookAt(0, 0, 0);
        
        // Adding background music
        this.listener = new THREE.AudioListener();
        this.camera_.add( this.listener );
        

        const background_music = new THREE.Audio( this.listener );

        this.audioLoader = new THREE.AudioLoader();
        this.audioLoader.load( '/sound/background.mp3', function( buffer ) {
            background_music.setBuffer( buffer );
            background_music.setLoop( true );
            background_music.setVolume( 0.8 );
            background_music.play();
        });

        // Creating a scene
        this.scene_ = new THREE.Scene();

        // Adding a directional light and a hemisphere light
        let light = new THREE.DirectionalLight(0xffffff, 2.0);
        light.position.set(-10, 10, -10);
        light.target.position.set(0, 0, 0);
        this.scene_.add(light);

        light = new THREE.HemisphereLight(0x202020, 0x004080, 0.6);
        this.scene_.add(light);

        // Adding a plane to signify the road and the size path
        // Also added the fog effect for far away objects
        this.scene_.background = new THREE.Color(0x808080);
        this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00125);

        const path = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 100, 10, 10),
            new THREE.MeshStandardMaterial({
                color: 0x47484c,
            })
        );
        path.castShadow = false;
        path.receiveShadow = true;
        path.rotation.x = -Math.PI / 2;
        this.scene_.add(path);

        const side = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 100, 10, 10),
            new THREE.MeshStandardMaterial({
                color: 0xf6f47f,
            })
        );
        side.castShadow = false;
        side.receiveShadow = true;
        side.rotation.x = -Math.PI / 2;
        side.position.y = -0.01;
        this.scene_.add(side);

        // Adding the sky-blue color using a sphere geometry
        const uniforms = {
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0x89b2eb) },
            offset: { value: 33 },
            exponent: { value: 0.6 },
        };
        const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            side: THREE.BackSide,
        });
        this.scene_.add(new THREE.Mesh(skyGeo, skyMat));

        // Initializing the world, player and background (side path objects and clouds) classes
        this.world_ = new world.WorldManager({ scene: this.scene_ });
        this.player_ = new player.Player({
            scene: this.scene_,
            world: this.world_,
        });
        this.background_ = new background.Background({scene: this.scene_});

        // Setting the game over variables and the current time
        this.gameOver_ = false;
        this.previousRAF_ = null;

        document.body.appendChild(this.renderer_.domElement);

        this.loop_();
        this.OnWindowResize_();
    }

    // Called when window is resized
    OnWindowResize_() {
        this.camera_.aspect = window.innerWidth / window.innerHeight;
        this.camera_.updateProjectionMatrix();
        this.renderer_.setSize(window.innerWidth, window.innerHeight);
    }

    // Game loop
    loop_() {
        requestAnimationFrame(t => {
            if (this.previousRAF_ === null) {
                this.previousRAF_ = t;
            }

            this.Step_((t - this.previousRAF_) / 1000.0);
            this.renderer_.render(this.scene_, this.camera_);
            this.previousRAF_ = t;
            this.loop_();
        });
    }

    // Loop to update all the classes
    Step_(timeElapsed) {
        if (this.gameOver_ || !this.gameStarted) {
            return;
        }
        this.player_.Update(timeElapsed);
        this.world_.Update(timeElapsed, this.player_.position);
        this.background_.Update(timeElapsed);

        if (this.player_.gameOver && !this.gameOver_) {
            this.gameOver_ = true;
            document.getElementById('game-over').classList.toggle('active');
        }
    }
}

let _APP = null;

// Start the game when all content is loaded
window.addEventListener('DOMContentLoaded', () => {
    _APP = new BasicWorld();
});
