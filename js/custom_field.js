import { GUI } from '../js/dat.gui.module.js';

// Texture Loader
const loader = new THREE.TextureLoader();
//Three Map
var msize = 1536;
var segs  = 64;
var segs_m  = parseInt(msize / segs);
var map = new Array();
const params = {
    wireframe: false,
    wireframe_ow: true,
    msize: msize,
    segs: segs,
    threshold: 0.25
};
var msize_format = {_x1_512m:512, _x3_1536m:1536, _x5_2560m:2560};
var segs_format = {_32:32, _64:64, _128:128, _256:256, _512:512};
var mesh;
var mesh_ow;
var scene;
var no;
export function init(_scene, _no){
    scene = _scene;
    
    const gui = new GUI();
    gui.add( params, 'wireframe' ).name( 'Wire Frame' ).onChange( update );
    gui.add( params, 'wireframe_ow' ).name( 'Wire Frame OW' ).onChange( update );
    gui.add( params, 'msize', msize_format ).name( 'Map Size(m)' ).onChange( update );
    gui.add( params, 'segs', segs_format ).name( 'Segments' ).onChange( update );
    //gui.add( params, 'threshold', 0, 1, 0.01 ).onChange( update );

    init_ground(_no);
}
function update(){
    scene.remove( mesh );
    scene.remove( mesh_ow );
    init_ground(no);
}

function init_ground(_no){
    no = _no;
    var _file_name = "./img/"+_no+".jpg";
    var index = 0; //_no;
    msize = params.msize;
    segs = params.segs;
    segs_m  = parseInt(msize / segs);
    //params.segs_m  = segs_m;
    console.log("msize:",msize);
    console.log("segs:",segs);
    console.log("segs_m:",segs_m);


    var groundGeometry  = new THREE.PlaneBufferGeometry( msize, msize, segs, segs ); //size(x,y) segs(x,y)
    //更新許可
    groundGeometry.attributes.position.needsUpdate = true;
    //法線更新
    //geometry_B.computeVertexNormals ();

    var groundTexture = loader.load(  _file_name );
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    //groundTexture.repeat.set( 900, 900 );
    //groundTexture.repeat.set( 500, 500 );

    //Note: rep値が大きいほど多くの回数繰り返す（画像が縮小表示される）
    let rep = msize/(10*2);
    groundTexture.repeat.set( rep, rep );

    groundTexture.anisotropy = 16;
    groundTexture.encoding = THREE.sRGBEncoding;


    var groundMaterial;
    if(params.wireframe){
	groundMaterial = new THREE.MeshStandardMaterial( { color: 0x00aa00,
							   wireframe: params.wireframe} );
    }else if( index == 10 || index == 11 || index == 13 ){
	let vec2=0.1;
	//if( index == 13 ){ vec2=0.1; }
	var normalTexture = loader.load(_file_name + '_N' + ".jpg" );
	//groundMaterial = new THREE.MeshPhongMaterial({  //光沢
	//groundMaterial = new THREE.MeshLambertMaterial({ //マット
	groundMaterial = new THREE.MeshStandardMaterial({
	    //color:0xffffff,
	    roughness:1, //0:光沢 - 1:マット(THREE.MeshStandardMaterialのみ)
	    map: groundTexture,
	    //normalScale: new THREE.Vector2(vec2, vec2),
	    normalMap: normalTexture
	});
	groundMaterial.normalScale.set( vec2, vec2 );
    }else{
	groundMaterial = new THREE.MeshLambertMaterial( { map: groundTexture } );
    }
    groundMaterial.side = THREE.DoubleSide;


    const meshGeometry = new THREE.PlaneBufferGeometry( 1024, 1024, 64, 64 );
    //const meshGeometry = new THREE.PlaneBufferGeometry( 1024, 1024, 32, 32 );
    //const meshGeometry = new THREE.PlaneBufferGeometry( 1024, 1024, 1, 1 );
    //material.map.repeat.set( .25, .25 );
    
    mesh = new THREE.Mesh( groundGeometry, groundMaterial );
    mesh.rotation.x = - Math.PI / 2;
    mesh.position.set(0, 0, 0);
    //mesh.layers.set( 0 );
    //set_layer(mesh, 1)
    //mesh.castShadow = true;
    //mesh.needsUpdate = true;
    //atmos.set_target( mesh );
		    
    scene.add( mesh );


    if(params.wireframe_ow){
	var Geo = new THREE.PlaneBufferGeometry( msize, msize, segs, segs );
	//var Material = new THREE.MeshBasicMaterial( { visible: false, side: THREE.FrontSide} );
	var Material = new THREE.MeshBasicMaterial( {color: 0x202020,  wireframe: true} ); //debug
	//var Material = new THREE.MeshLambertMaterial({ map: texture, transparent: true });
	mesh_ow = new THREE.Mesh(Geo,Material);
	mesh_ow.position.set(0,5,0);
	mesh_ow.rotation.x = - Math.PI / 2;
	scene.add(mesh_ow)
    }
	    
}

