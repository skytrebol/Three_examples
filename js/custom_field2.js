import { Terrain } from '../js/Terrain.js?13';
import { GUI } from '../js/dat.gui.module.js';

//var THREE = window.THREE;
//var Math = window.Math;

// Texture Loader
const loader = new THREE.TextureLoader();
//Three Map
var msize = 512; //1つのmapcellのサイズ(m)
var mnum = 5; //mapcellの個数
var rep = 32; //1つのmapcell内のテクスチャ繰返し回数
var mtex = 16; //1つのmapcell内のテクスチャ領域(Mesh)数
var segs  = 64;//1つのmapcell内の頂点数
var segs_m  = parseInt(msize / segs); //頂点間の長さ(m)
var map = new Array();
var ow_y = 1; //Over Wrap Wire Frameの高さ
const params = {
    wireframe: false,
    wireframe_ow: false,
    msize: msize,
    mnum: mnum,
    mtex: mtex,
    rep: rep,
    segs: segs,
    ow_y: ow_y,
    threshold: 0.25
};
var msize_format = {_256m:256, _512m:512, _1024m:1024, _2048m:2048};
var mnum_format = {_x1:1, _x3:3, _x5:5};
var mtex_format = {_x1:1, _x4:4, _x8:8, _x16:16, _x32:32};
var rep_format = {_x4:4, _x8:8, _x16:16, _x24:24, _x32:32, _x64:64};
var segs_format = {_16:16, _32:32, _64:64, _80:80, _128:128, _256:256, _512:512};
var mesh;
var mesh_ow;
var scene;
var no;

var use_custom_terrain=0;
var lm = null;
var models = {}; //meshs
//var tmap = new window.ThreeMap(lm, scene);
var tmap = null;

var terrain;

export function init(_scene, _no){
    console.log(window);

    scene = _scene;
    
    const gui = new GUI();
    gui.add( params, 'wireframe' ).name( 'Wire Frame' ).onChange( update );
    gui.add( params, 'wireframe_ow' ).name( 'Wire Frame OW' ).onChange( update );
    gui.add( params, 'msize', msize_format ).name( 'Map Size(m)' ).onChange( update );
    gui.add( params, 'mnum', mnum_format ).name( 'Maps(mnum)' ).onChange( update );
    gui.add( params, 'mtex', mtex_format ).name( 'Mesh(mtex)' ).onChange( update );
    gui.add( params, 'rep', rep_format ).name( 'Rep(rep)' ).onChange( update );
    gui.add( params, 'segs', segs_format ).name( 'Segments(segs)' ).onChange( update );
    gui.add( params, 'ow_y', -50, 50, 0.5 ).onChange( update );
    //gui.add( params, 'threshold', 0, 1, 0.01 ).onChange( update );

    update();
}
function update(){
    var _no = 13;
    var _kx = 2;
    var _ky = 2;

    msize = params.msize;
    mnum = params.mnum;
    mtex = params.mtex;
    segs = params.segs;
    rep = params.rep;
    ow_y = params.ow_y;
    segs_m  = parseInt(msize / segs);
    console.log("---------------------");
    console.log("msize:",msize);
    console.log("mnum:",mnum);
    console.log("mtex:",mtex);
    console.log("rep:",rep);
    console.log("segs:",segs);
    console.log("segs_m:",segs_m);

    if(terrain){terrain.remove_all();}
    if(mesh_ow){scene.remove(mesh_ow)}

    terrain = new Terrain(lm, "./img/", scene, msize, mnum, mtex, rep, segs, tmap, models, params.wireframe, use_custom_terrain);
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

}


