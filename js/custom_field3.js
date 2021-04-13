import { OrbitControls } from '../js/OrbitControls.js';
import { Terrain } from '../js/Terrain2.js?14';
import { GUI } from '../js/dat.gui.module.js';
import { GLTFLoader } from '../js/GLTFLoader.r126.js';

var physijs=1;
if (typeof Physijs === 'undefined') {
    physijs=0;
}


//import { TestCubeBox } from './TestCubeBox.js?0';
//var testCubeBox = new TestCubeBox();

//var THREE = window.THREE;
//var Math = window.Math;

// Texture Loader
const loader = new THREE.TextureLoader();
//Three Map
var box = true;//Boxをふらせる
var fpv = true;//First Person View
var msize = 512; //1つのmapcellのサイズ(m)
var mnum = 5; //mapcellの個数
var rep = 32; //1つのmapcell内のテクスチャ繰返し回数
var mtex = 8; //1つのmapcell内のテクスチャ領域(Mesh)数
var perlin = 2000; //perlinノイズの強さ
var segs  = 64;//1つのmapcell内の頂点数
var segs_m  = parseInt(msize / segs); //頂点間の長さ(m)
var map = new Array();
var ow_y = 1; //Over Wrap Wire Frameの高さ
const params = {
    wireframe: false,
    wireframe_ow: false,
    box: true,
    fpv: true,
    msize: msize,
    mnum: mnum,
    mtex: mtex,
    perlin: 2000,
    rep: rep,
    segs: segs,
    ow_y: ow_y,
    threshold: 0.25
};
var msize_format = {_128m:128, _256m:256, _512m:512, _1024m:1024, _2048m:2048};
var mnum_format = {_x1:1, _x3:3, _x5:5, _x7:7, _x9:9};
var mtex_format = {_x1:1, _x4:4, _x8:8, _x16:16, _x32:32};
var rep_format = {_x2:2, _x4:4, _x8:8, _x16:16, _x24:24, _x32:32, _x64:64, _x128:128};
var segs_format = {_16:16, _32:32, _64:64, _80:80, _128:128, _256:256, _512:512};
var mesh;
var mesh_ow;
var scene;
var camera;
var renderer;
var no;
var controls;

//var use_custom_terrain=null;
var use_custom_terrain={x:0, y:-1, rock_x:0, rock_y:0};
//var use_custom_terrain={x:0, y:0, rock_x:0, rock_y:0};

var lm = null;
var models = {}; //meshs
//var tmap = new window.ThreeMap(lm, scene);
var tmap = null;
var ball;
var ballSize = 1;
var ball_mixer;

var character = {}
function create_character(_character){
    _character.position = new THREE.Vector3(1,170,1);
    _character.vec = new THREE.Vector2(0,1);
    _character.center = new THREE.Vector2(0,0);
}

var terrain;

var idleAction, walkAction, runAction;
var actions;

export function init(_ctl, _no){
    console.log(window);

    scene = _ctl.scene;
    camera = _ctl.camera;
    renderer = _ctl.renderer;

   

    //GLTF_load('snow', './gltf/_DreadZone_LOD3_mos_rock.glb', {size:1,x:0,y:0,z:0,rot_x:Math.PI*0.5,cast_shadow:0,receive_shadow:1,hide:1});
    GLTF_load('snow', './gltf/_DreadZone_LOD3_low.glb', {size:1,x:0,y:0,z:0,rot_x:Math.PI*0.5,cast_shadow:0,receive_shadow:1,hide:1,func:position_conv});
    function position_conv(_name){
	let c=0;
	if( models["snow"].children.length>5 ){c = 5; } //HACK XXXXXXXXXXXXXXXXXXX
	let pos = models["snow"].children[c].children[0].geometry.attributes.position;
	for( let p = 0 ; p<pos.count ; p++ ){
//	    console.log(pos.getX(p),pos.getY(p));
//-25913.677734375 25913.677734375
//-32768 32768 "---"
	    pos.setX(p, (-256+((p*8)%512))*128 );
	    pos.setY(p, ( 256-parseInt((p*8)/512)*8)*128 );
//	    console.log(pos.getX(p),pos.getY(p),"---");
	}
    }

    const gui = new GUI();
    gui.add( params, 'wireframe' ).name( 'Wire Frame' ).onChange( update );
    gui.add( params, 'wireframe_ow' ).name( 'Wire Frame OW' ).onChange( update );
    gui.add( params, 'box' ).name( 'Box' ).onChange( update );
    gui.add( params, 'fpv' ).name( 'FP View' ).onChange( update );
    gui.add( params, 'msize', msize_format ).name( 'Map Size(m)' ).onChange( update );
    gui.add( params, 'mnum', mnum_format ).name( 'Maps(mnum)' ).onChange( update );
    gui.add( params, 'mtex', mtex_format ).name( 'Mesh(mtex)' ).onChange( update );
    gui.add( params, 'perlin', 100, 3000, 100 ).onChange( update );
    gui.add( params, 'rep', rep_format ).name( 'Rep(rep)' ).onChange( update );
    gui.add( params, 'segs', segs_format ).name( 'Segments(segs)' ).onChange( update );
    gui.add( params, 'ow_y', -50, 50, 0.5 ).onChange( update );
    //gui.add( params, 'threshold', 0, 1, 0.01 ).onChange( update );

//    scene.addEventListener('update',drive);
    function drive() {
	scene.simulate( undefined, 2 );
    }

    create_character(character);

    var container = document.querySelector('#root');
    if( container ){
	let doc = document.createElement( 'div' );
	doc.style.position = "fixed";
	doc.style.bottom = "30px";
	doc.style.left = parseInt((document.body.clientWidth - 100*3)/2)+"px";
	doc.innerHTML = "<button class='b0' onclick='onKeyDown({keyCode:37});' style='width:100px;height:60px;' >←</button>"+
	    "<button class='b0' onclick='onKeyDown({keyCode:38});' style='width:100px;height:60px;' >↑</button>"+
	    "<button class='b0' onclick='onKeyDown({keyCode:39});' style='width:100px;height:60px;' >→</button>";
	container.appendChild( doc );
    }


    update();

    //return (! fpv);
    return 0; //orbit
}




var use_ball = 0;
function update(){
    var _no = 13;
    var _kx = 2;
    var _ky = 2;

    msize = params.msize;
    mnum = params.mnum;
    box = params.box;
    fpv = params.fpv;
    mtex = params.mtex;
    segs = params.segs;
    rep = params.rep;
    perlin = params.perlin;
    ow_y = params.ow_y;
    segs_m  = parseInt(msize / segs);
    console.log("---------------------");
    console.log("msize:",msize);
    console.log("mnum:",mnum);
    console.log("box:",box);
    console.log("mtex:",mtex);
    console.log("rep:",rep);
    console.log("segs:",segs);
    console.log("segs_m:",segs_m);

    if(terrain){terrain.remove_all();}
    if(mesh_ow){scene.remove(mesh_ow)}

    terrain = new Terrain(lm, "./img/", scene, msize, mnum, mtex, rep, segs, tmap, models, perlin, params.wireframe, use_custom_terrain);
    terrain.join_gradient(_no, _kx, _ky);

    if(params.wireframe_ow){
	var Geo = new THREE.PlaneBufferGeometry( msize*mnum, msize*mnum, segs*mnum, segs*mnum );
	//var Material = new THREE.MeshBasicMaterial( { visible: false, side: THREE.FrontSide} );
	var Material = new THREE.MeshBasicMaterial( {color: 0xa02020,  wireframe: true} ); //debug
	//var Material = new THREE.MeshLambertMaterial({ map: texture, transparent: true });
	mesh_ow = new THREE.Mesh(Geo,Material);
	mesh_ow.position.set(0,ow_y,0);
	mesh_ow.rotation.x = - Math.PI / 2;
	scene.add(mesh_ow)
    }


    if( box ){
	if( box_objs.length ){
	    update_physi_test_box();
	}else{
	    create_physi_test_box();
	}
    }


    if( fpv && !ball ){
	if(use_ball){
	const ballGeo = new THREE.SphereBufferGeometry( ballSize, 8, 4 );
	//const ballMaterial = new THREE.MeshLambertMaterial();
	//const ballMaterial = new THREE.MeshBasicMaterial( {color: 0xa02020,  wireframe: true} ); //debug
	const ballMaterial = new THREE.MeshBasicMaterial( { visible: false, side: THREE.FrontSide } );
	ball = new THREE.Mesh( ballGeo, ballMaterial );
	ball.position.copy( character.position );
	ball.castShadow = true;
	//sphere.receiveShadow = true;
	//ball.visible = false;
	scene.add( ball );
	models["ball"] = ball;
	}

	glb_loader.load( './gltf/Soldier.glb', function ( gltf ) {
            let model = gltf.scene;
	    models["soldier"] = model;
	    if( use_ball ){
		ball.add( model );
		model.position.set(0,-ballSize,0);
	    }else{
		models["ball"] = ball = model;
		scene.add( model );
	    }

            model.traverse( function ( object ) {
		if ( object.isMesh ) object.castShadow = true;
            } );
            //
            /* let skeleton = new THREE.SkeletonHelper( model );
            skeleton.visible = false;
            scene.add( skeleton ); */
            //
            //createPanel();
            //
            const animations = gltf.animations;
            ball_mixer = new THREE.AnimationMixer( model );
            idleAction = ball_mixer.clipAction( animations[ 0 ] );
            walkAction = ball_mixer.clipAction( animations[ 3 ] );
            runAction = ball_mixer.clipAction( animations[ 1 ] );
            actions = [ idleAction, walkAction, runAction ];
	    idleAction.setEffectiveWeight( 1.0 );
	    walkAction.setEffectiveWeight( 0.0 );
	    runAction.setEffectiveWeight( 0.0 );
	    let w=1.0;
	    actions.forEach( function ( action ) {
		action.enabled = true;
		action.setEffectiveTimeScale( 1 );
		action.setEffectiveWeight( w );w=0.0;
		action.play();
	    } );
            //activateAllActions();
            //animate();
	} );

	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);
    }

    if( ! fpv ){
	if( controls ){
	    controls.object.position.copy( camera.position );
	    //controls.terget.position.copy( ball.position );
	    controls.saveState();
	    controls.reset();
	}else{
	    controls = new OrbitControls( camera, renderer.domElement );
	    controls.maxPolarAngle = Math.PI*0.5;
	    controls.minDistance = 10;
	    controls.maxDistance = 5000;
	}
    }

}

var KEY_W = 87;
var KEY_UP = 38;
var KEY_S = 83;
var KEY_DOWN = 40;
var KEY_A = 65;
var KEY_LEFT = 37;
var KEY_D = 68;
var KEY_RIGHT = 39;
var KEY_SPACE = 32;


var press_up = 0;
function onKeyDown(event) {
    //if (this.isDisabled) return;
    //if (isInputEvent(event)) return;
    //console.log(event.keyCode);
  switch (event.keyCode) {
    case KEY_W:
    case KEY_UP:
      //this.isUp = true;
      character.position.x -= character.vec.x;
      character.position.z -= character.vec.y;
      if( press_up ){
	  press_up = 0;
      }else{
	  press_up = 1;
      }
      break;

    case KEY_S:
    case KEY_DOWN:
      //this.isDown = true;
      character.position.x += character.vec.x;
      character.position.z += character.vec.y;
      break;

    case KEY_A:
    case KEY_LEFT:
      //this.isLeft = true;
      character.vec.rotateAround(character.center, -Math.PI/32);
      break;

    case KEY_D:
    case KEY_RIGHT:
      //this.isRight = true;
      character.vec.rotateAround(character.center, Math.PI/32);
      break;

    case KEY_SPACE:
      //this.jump();
      break;

    default:
      return;
  }

}
window.onKeyDown=onKeyDown;
function onKeyUp(event) {

  switch (event.keyCode) {
    case KEY_W:
    case KEY_UP:
      press_up = 0;
      break;
  }


/*
  if (this.isDisabled) return;

  switch (event.keyCode) {
    case KEY_W:
    case KEY_UP:
      this.isUp = false;
      break;

    case KEY_S:
    case KEY_DOWN:
      this.isDown = false;
      break;

    case KEY_A:
    case KEY_LEFT:
      this.isLeft = false;
      break;

    case KEY_D:
    case KEY_RIGHT:
      this.isRight = false;
      break;

    case KEY_SPACE:
      break;

    default:
      return;
  }

  var prevAngle = this.frontAngle;
  this.updateAngle();

  if (prevAngle !== this.frontAngle) {
    this.dispatchEvent({
      type: 'movekeychange'
    });
  }

  if (!this.isUp && !this.isDown && !this.isLeft && !this.isRight && (event.keyCode === KEY_W || event.keyCode === KEY_UP || event.keyCode === KEY_S || event.keyCode === KEY_DOWN || event.keyCode === KEY_A || event.keyCode === KEY_LEFT || event.keyCode === KEY_D || event.keyCode === KEY_RIGHT)) {
    this.isMoveKeyHolding = false;
    this.dispatchEvent({
      type: 'movekeyoff'
    });
  }
*/
}

var walk=0;
export function animate( now, scene, camera, clock, delta ) {
    if(ball_mixer){
	//clock = new THREE.Clock();
	//delta = clock.getDelta();
	//console.log(delta);
	//Animation Mixerを実行
        ball_mixer.update(delta);
    }


    //testCubeBox.update(camera,models["cube"]);
    //update_physi_test_box();
    if( box ){
	scene.simulate( undefined, 2 );
    }

    if( press_up ){
	character.position.x -= (character.vec.x/8/4 * (1+is_mobile()*20) );
	character.position.z -= (character.vec.y/8/4 * (1+is_mobile()*20) );

	if(actions){
	    walk=2;
	    //actions.forEach( function ( action ) { action.stop(); } );
	    idleAction.setEffectiveWeight( 0.0 );
	    walkAction.setEffectiveWeight( 0.0 );
	    runAction.setEffectiveWeight( 1.0 );
	    //actions.forEach( function ( action ) { action.play(); } );
	}
    }else{
	if(actions && walk==0){
	    //actions.forEach( function ( action ) { action.stop(); } );
	    idleAction.setEffectiveWeight( 1.0 );
	    walkAction.setEffectiveWeight( 0.0 );
	    runAction.setEffectiveWeight( 0.0 );
	    //actions.forEach( function ( action ) { action.play(); } );
	}
	if(walk>0){walk--;}
    }


    if( fpv && ball ){
	let cp = character.position;
	let cv = character.vec;

	models["ball"].position.copy( cp );
	if( use_ball ){
	    ground_object_core(scene, models["ball"], ballSize);
	}else{
	    ground_object_core(scene, models["ball"], -0.01);
	}

	let l = 8;
	camera.position.set(models["ball"].position.x + cv.x * l ,
			    models["ball"].position.y + l/32 ,
			    models["ball"].position.z + cv.y * l  );
	ground_object_core(scene, camera, l/32 + (camera.position.y - models["ball"].position.y)*8 );

	//console.log( camera.position.x, camera.position.y, camera.position.z );

	//let vec = new THREE.Vector3(ball.position.x - cv.x*l, ball.position.y +0.1*l, ball.position.z - cv.y*l ); 
	//camera.lookAt(vec);
	camera.lookAt(ball.position);


	if(actions){
	    models["soldier"].rotation.copy( camera.rotation );
	}
    }

}





//
//
// BOX
//
//
var box_max = 50;
var box_objs = new Array();
function create_physi_test_box() {
    if( physijs && box_max>0 ){

	//
	// box
	//
	var boxTextureLoader = new THREE.TextureLoader();
	let box_material = Physijs.createMaterial(
	    new THREE.MeshLambertMaterial({ map: boxTextureLoader.load( './img/plywood.jpg' ) }),
		.4, // low friction
		.6 // high restitution
	);
	box_material.map.wrapS = THREE.RepeatWrapping;
	box_material.map.repeat.set( .25, .25 );

	update_physi_test_box();
	for (let i = 0; i < box_max; i++ ) {
	//var size = Math.random() * 2 + .5;
	    var size = Math.random() * 20 + .5;
	    var box = new Physijs.BoxMesh(
		new THREE.BoxGeometry( size, size, size ),
		box_material
	    );
	    //set_layer(box, 1); //当たり判定に加える

	    box.castShadow = true;
	    //box.receiveShadow = true;
	    box.position.set(
		//Math.random() * 25 - 50,
		Math.random() * 250 - 500  +300,
		//5,
		170,
		//Math.random() * 25 - 50
		Math.random() * 250 - 500  +300
	    );
	    //box.setCcdSweptSphereRadius(0.2);
	    scene.add( box );
	    box_objs[i] = box;
	}
    }
}
function update_physi_test_box() {
    //
    // box
    //
    for (let i = 0; i < box_max; i++ ) {
	if( box_objs[i] ){
	    scene.remove( box_objs[i] );

	    box_objs[i].position.set(
		//Math.random() * 25 - 50,
		Math.random() * 250 - 500  +300,
		//5,
		170,
		//Math.random() * 25 - 50
		Math.random() * 250 - 500  +300
	    );

	    scene.add( box_objs[i] );
	}
    }
}

function ground_object(_scene, _target) {
    var _object = models[_target];
    ground_object_core(_scene, _object, 0);
}
function ground_object_core(_scene, _object, y_gap) {
    if( ! y_gap ){ y_gap=0; } 
    var _x = _object.position.x;
    var _y = _object.position.y;
    var _z = _object.position.z;

    var TopOverPos = new THREE.Vector3(_x, 65535, _z); //1.はるか上空のポイントを用意
    var downVect = new THREE.Vector3(0,-1,0);     //下向きのベクトルのみが入ったVector3を用意

    var _ray = new THREE.Raycaster(TopOverPos, downVect.normalize());  //2.真下に向かう線がコレ
//    _ray.layers.set( 1 );

    var maxY = -65535;  //衝突対象が複数あった場合、一番「高い」ものを取得するようにします
    var objs = _ray.intersectObjects(_scene.children, true);   //衝突点検出！
    if( objs.length > 0 ){
	for (var i = 0; i < objs.length; i++) {
	    var name = get_object_name(objs[i].object, "name");
	    if( name == "ground" || name.indexOf("ground")>-1 ){
		if(maxY <  objs[i].point.y){ maxY = objs[i].point.y; }
	    }
	}
	if(maxY>-65535){ _object.position.y = maxY + y_gap; }
    }

}
function get_object_name(p, target) {
    var name="";
    while( ! name ){
	if( (p.parent == null) || (p.parent && p.parent.type == "Scene") ){
	    name = p[target];
	    break;
	}else{
	    if( p.parent ){
		p = p.parent;
	    }else{
		name="not_found";
		break;
	    }
	}
    }
    return name;
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
window.is_mobile = is_mobile;


const glb_loader = new GLTFLoader();
function GLTF_load(_name, _path, _conf) {
    glb_loader.load( _path, function ( _gltf ) {
        var model = _gltf.scene;
        model.name = _name;
	models[model.name] = model;//XXXX
	var cast_shadow = 1;
	var receive_shadow  = 0;
	if( _conf ){
	    if( 'selectable' in _conf  ){
		model_objs.push(model);//XXXX
		set_layer(model, _conf['selectable']);
	    }
	    if( 'size' in _conf  ){
		model.scale.set(_conf['size'],_conf['size'],_conf['size']);
	    }
	    if( 'x' in _conf && 'y' in _conf && 'z' in _conf ){
		model.position.set(_conf['x'],_conf['y'],_conf['z']);
	    }
	    let rx=0,ry=0,rz=0;
	    if( 'rot_x' in _conf ){ rx = parseInt(_conf['rot_x']); }
	    if( 'rot_y' in _conf ){ ry = parseInt(_conf['rot_y']); }
	    if( 'rot_z' in _conf ){ rz = parseInt(_conf['rot_z']); }
	    model.rotation.set(rx,ry,rz);
	    if( 'cast_shadow' in _conf ){ cast_shadow = _conf['cast_shadow']; }
	    if( 'receive_shadow' in _conf ){ receive_shadow = _conf['receive_shadow']; }
	}
	if( cast_shadow ){
	    model.castShadow = true;
	    model.traverse((_object) => {
		if(_object.isMesh) { _object.castShadow = true; }
            });
	}
	if( receive_shadow ){
	    model.receiveShadow = true;
	    model.traverse((_object) => {
		if(_object.isMesh) { _object.receiveShadow = true; }
            });
	}

        var animations = _gltf.animations;
	//console.log(model.name+" Animation: ",animations.length);
	if(animations && animations.length) {
            mixer = new THREE.AnimationMixer(model);
	    animations.forEach(_anim => {
                let action = mixer.clipAction(_anim);
		if( action ){
		    //action.setLoop(THREE.LoopOnce);//ループ設定（1回のみ）
		    //action.clampWhenFinished = true;//最後のフレームでアニメ終了
		    action.play();
		}
            });
	}
	if( _conf['hide'] ){
	    if( _conf['hide']==2 ){ model.visible = false; }
	}else{
            scene.add( model );
	}
	if( _conf['func'] ){
	    _conf['func']( _name );
	}
    	//ground_object(scene, _name)
    }, undefined, function ( error ) {
        console.error( error );
	// dummyの四角ポリゴンを挿入
	//XXXXXXXXXXXX
    } );
}
