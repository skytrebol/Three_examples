import Stats from '../js/stats.module.js';
import { OrbitControls } from '../js/OrbitControls.js';
//import { OBJLoader } from '../js/three.js/examples/jsm/loaders/OBJLoader.js';
import * as CUSTOM_FIELD from '../js/custom_field.js';
import * as CUSTOM_FIELD2 from '../js/custom_field2.js?7';
import * as CUSTOM_FIELD3 from '../js/custom_field3.js?13';

var THREE = window.THREE;
var Physijs = window.Physijs;


/*
 * Cloth Simulation using a relaxed constraints solver
 */

var container, stats;
var camera, scene, renderer;
var clock = new THREE.Clock();
var orbit = 1;

var mode;



export function init( _mode ) {
    mode = _mode;

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // scene
    if (typeof Physijs === 'undefined') {
	scene = new THREE.Scene();
    }else{
	scene = new Physijs.Scene;
	scene.setGravity(new THREE.Vector3( 0, -9.82, 0 ));
    }


    scene.background = new THREE.Color( 0xcce0ff );
    //NO-FOG	scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );


    // camera
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.set( 1000, 30+1.8, 1500 );
//    camera.position.set( 1000, 2, 1500 );
    camera.layers.enable( 0 );
    camera.layers.enable( 1 );

    // base lights
    scene.add( new THREE.AmbientLight( 0x666666 ) );

    // lights
    const light = new THREE.DirectionalLight( 0xdfebff, 1 );
    ///light.position.set( 50, 200, 100 );
    ///light.position.multiplyScalar( 1.3 );
    light.position.set( 0.5, 3, 1 );
    light.position.multiplyScalar( 100 );
//    light.layers.set( 1 );

    light.castShadow = true;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;

    const d = 750;
    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;
    light.shadow.camera.far = 2000;
    scene.add( light );


    // renderer
    renderer = new THREE.WebGLRenderer( { antialias: true, alpha:true } ); //, alpha: true
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;


    // performance monitor
    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );



    // ground
    orbit = 1;
    if( _mode == "custom_field" ){
	CUSTOM_FIELD.init(scene, 13);
    }else if( _mode == "custom_field2" ){
	CUSTOM_FIELD2.init(scene, 13);
    }else if( _mode == "custom_field3" ){
	orbit = CUSTOM_FIELD3.init({scene:scene, camera:camera, renderer:renderer}, 13);
    }


    // controls
    if( orbit ){
	const controls = new OrbitControls( camera, renderer.domElement );
	controls.maxPolarAngle = Math.PI*0.5;
	controls.minDistance = 10;
	controls.maxDistance = 5000;
    }


    //animate
    animate( 0 );
}






function animate_mesh(_delta){
    if( mesh ){
	mesh.update({time:(1.0 / 90.0)});
    }
}



function onWindowResize() {
    var w = document.body.clientWidth;
    var h = document.body.clientHeight;
    if( !w || !h ){
	w = window.innerWidth;
	h = window.innerHeight;
    }

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize( w, h );
    
}

function set_layer(_model, _layer) {
    _model.layers.set( _layer );
    for(let i = 0; i < _model.children.length; i++){
        set_layer( _model.children[i], _layer );
    }
}


//

function animate( now ) {
    let mobile = is_mobile();
    let delta = clock.getDelta();
    
    if(mobile>0){
	var fps = 10; //tablet
	if(mobile==2){ //mobile phone
	    fps = 3;
	}
	setTimeout(function() {
	    requestAnimationFrame( animate );
	    // ここで Canvasに描画する処理を実行する
	}, 1000 / fps); // フレーム毎に実行させる
    }else{
	requestAnimationFrame( animate );
    }

    if(stats){stats.update();}


    // ground
    if( mode == "custom_field" ){
    }else if( mode == "custom_field2" ){
    }else if( mode == "custom_field3" ){
	CUSTOM_FIELD3.animate(now, scene, camera, clock, delta);
    }


    //animate_mesh(delta);

    renderer.render( scene, camera );
}

function is_mobile() {
    if(window.createjs && window.createjs.Touch.isSupported() == true ){ //iPad size(768x1024)
	if( window.screen.width < 768 ){ //iPad size(768x1024)
	    return 2;
	}
	return 1;
    }

    return 0;
}
