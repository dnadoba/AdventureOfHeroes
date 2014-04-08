define([
'configs/client',
'vendors/utili/q',
'vendors/utili/path',
'three',
], function(config, Q, path, THREE){
    /**
     * @author alteredq / http://alteredqualia.com/
     */
    
    var Loader = function (resourceController, showStatus ) {
    
        this.resourceController = resourceController;
        this.showStatus = showStatus;
        this.statusDomElement = showStatus ? Loader.prototype.addStatusElement() : null;
    
        this.onLoadStart = function () {};
        this.onLoadProgress = function () {};
        this.onLoadComplete = function () {};
    
    };
    
    Loader.prototype = {
        
        resourceController : {},
        
        constructor: Loader,
    
        crossOrigin: undefined,
    
        addStatusElement: function () {
    
            var e = document.createElement( "div" );
    
            e.style.position = "absolute";
            e.style.right = "0px";
            e.style.top = "0px";
            e.style.fontSize = "0.8em";
            e.style.textAlign = "left";
            e.style.background = "rgba(0,0,0,0.25)";
            e.style.color = "#fff";
            e.style.width = "120px";
            e.style.padding = "0.5em 0.5em 0.5em 0.5em";
            e.style.zIndex = 1000;
    
            e.innerHTML = "Loading ...";
    
            return e;
    
        },
    
        updateProgress: function ( progress ) {
    
            var message = "Loaded ";
    
            if ( progress.total ) {
    
                message += ( 100 * progress.loaded / progress.total ).toFixed(0) + "%";
    
    
            } else {
    
                message += ( progress.loaded / 1000 ).toFixed(2) + " KB";
    
            }
    
            this.statusDomElement.innerHTML = message;
    
        },
    
        extractUrlBase: function ( url ) {
    
            var parts = url.split( '/' );
    
            if ( parts.length === 1 ) return './';
    
            parts.pop();
    
            return parts.join( '/' ) + '/';
    
        },
    
        initMaterials: function ( materials, texturePath ) {
            var array = [];
    
            for ( var i = 0; i < materials.length; ++ i ) {
    
                array[ i ] = this.createMaterial(materials[ i ], texturePath );
    
            }
    
            return array;
    
        },
    
        needsTangents: function ( materials ) {
    
            for( var i = 0, il = materials.length; i < il; i ++ ) {
    
                var m = materials[ i ];
    
                if ( m instanceof THREE.ShaderMaterial ) return true;
    
            }
    
            return false;
    
        },
    
        createMaterial: function ( m, texturePath ) {
            var _this = this;
    
            function is_pow2( n ) {
    
                var l = Math.log( n ) / Math.LN2;
                return Math.floor( l ) == l;
    
            }
    
            function nearest_pow2( n ) {
    
                var l = Math.log( n ) / Math.LN2;
                return Math.pow( 2, Math.round(  l ) );
    
            }
    
            function load_image( where, url ) {
                return _this.resourceController.loadImage(url).then(function(image){
                    if ( !is_pow2( image.width ) || !is_pow2( image.height ) ) {
    
                        var width = nearest_pow2( image.width );
                        var height = nearest_pow2( image.height );
    
                        where.image.width = width;
                        where.image.height = height;
                        where.image.getContext( '2d' ).drawImage( image, 0, 0, width, height );
    
                    } else {
    
                        where.image = image;
    
                    }
    
                    where.needsUpdate = true;
    
                });
            }
    
            function create_texture( where, name, sourceFile, repeat, offset, wrap, anisotropy ) {
                var isCompressed = /\.dds$/i.test( sourceFile );
    
                var fullPath = texturePath + sourceFile;
    
                if ( isCompressed ) {
    
                    var texture = THREE.ImageUtils.loadCompressedTexture( fullPath );
    
                    where[ name ] = texture;
    
                } else {
    
                    var texture = document.createElement( 'canvas' );
    
                    where[ name ] = new THREE.Texture( texture );
    
                }
    
                where[ name ].sourceFile = sourceFile;
    
                if( repeat ) {
    
                    where[ name ].repeat.set( repeat[ 0 ], repeat[ 1 ] );
    
                    if ( repeat[ 0 ] !== 1 ) where[ name ].wrapS = THREE.RepeatWrapping;
                    if ( repeat[ 1 ] !== 1 ) where[ name ].wrapT = THREE.RepeatWrapping;
    
                }
    
                if ( offset ) {
    
                    where[ name ].offset.set( offset[ 0 ], offset[ 1 ] );
    
                }
    
                if ( wrap ) {
    
                    var wrapMap = {
                        "repeat": THREE.RepeatWrapping,
                        "mirror": THREE.MirroredRepeatWrapping
                    }
    
                    if ( wrapMap[ wrap[ 0 ] ] !== undefined ) where[ name ].wrapS = wrapMap[ wrap[ 0 ] ];
                    if ( wrapMap[ wrap[ 1 ] ] !== undefined ) where[ name ].wrapT = wrapMap[ wrap[ 1 ] ];
    
                }
    
                if ( anisotropy ) {
    
                    where[ name ].anisotropy = anisotropy;
    
                }
    
                if ( ! isCompressed ) {
                    
                    return load_image( where[ name ], fullPath );
                    
                }else{
                    
                    return Q.resolve();
                    
                }
    
            }
    
            function rgb2hex( rgb ) {
    
                return ( rgb[ 0 ] * 255 << 16 ) + ( rgb[ 1 ] * 255 << 8 ) + rgb[ 2 ] * 255;
    
            }
    
            // defaults
    
            var mtype = "MeshLambertMaterial";
            var mpars = { color: 0xeeeeee, opacity: 1.0, map: null, lightMap: null, normalMap: null, bumpMap: null, wireframe: false };
    
            // parameters from model file
    
            if ( m.shading ) {
    
                var shading = m.shading.toLowerCase();
    
                if ( shading === "phong" ) mtype = "MeshPhongMaterial";
                else if ( shading === "basic" ) mtype = "MeshBasicMaterial";
    
            }
    
            if ( m.blending !== undefined && THREE[ m.blending ] !== undefined ) {
    
                mpars.blending = THREE[ m.blending ];
    
            }
    
            if ( m.transparent !== undefined || m.opacity < 1.0 ) {
    
                mpars.transparent = m.transparent;
    
            }
    
            if ( m.depthTest !== undefined ) {
    
                mpars.depthTest = m.depthTest;
    
            }
    
            if ( m.depthWrite !== undefined ) {
    
                mpars.depthWrite = m.depthWrite;
    
            }
    
            if ( m.visible !== undefined ) {
    
                mpars.visible = m.visible;
    
            }
    
            if ( m.flipSided !== undefined ) {
    
                mpars.side = THREE.BackSide;
    
            }
    
            if ( m.doubleSided !== undefined ) {
    
                mpars.side = THREE.DoubleSide;
    
            }
    
            if ( m.wireframe !== undefined ) {
    
                mpars.wireframe = m.wireframe;
    
            }
    
            if ( m.vertexColors !== undefined ) {
    
                if ( m.vertexColors === "face" ) {
    
                    mpars.vertexColors = THREE.FaceColors;
    
                } else if ( m.vertexColors ) {
    
                    mpars.vertexColors = THREE.VertexColors;
    
                }
    
            }
    
            // colors
    
            if ( m.colorDiffuse ) {
    
                mpars.color = rgb2hex( m.colorDiffuse );
    
            } else if ( m.DbgColor ) {
    
                mpars.color = m.DbgColor;
    
            }
    
            if ( m.colorSpecular ) {
    
                mpars.specular = rgb2hex( m.colorSpecular );
    
            }
    
            if ( m.colorAmbient ) {
    
                mpars.ambient = rgb2hex( m.colorAmbient );
    
            }
    
            // modifiers
    
            if ( m.transparency ) {
    
                mpars.opacity = m.transparency;
    
            }
    
            if ( m.specularCoef ) {
    
                mpars.shininess = m.specularCoef;
    
            }
    
            // textures
            
            var texturesLoaded = [];
            
            if ( m.mapDiffuse && texturePath ) {
    
                texturesLoaded.push(
                    create_texture( mpars, "map", m.mapDiffuse, m.mapDiffuseRepeat, m.mapDiffuseOffset, m.mapDiffuseWrap, m.mapDiffuseAnisotropy )
                );
                
            }
    
            if ( m.mapLight && texturePath ) {
                
                texturesLoaded.push(
                    create_texture( mpars, "lightMap", m.mapLight, m.mapLightRepeat, m.mapLightOffset, m.mapLightWrap, m.mapLightAnisotropy )
                );
                
            }
    
            if ( m.mapBump && texturePath ) {
                
                texturesLoaded.push(
                    create_texture( mpars, "bumpMap", m.mapBump, m.mapBumpRepeat, m.mapBumpOffset, m.mapBumpWrap, m.mapBumpAnisotropy )
                );
                
            }
    
            if ( m.mapNormal && texturePath ) {
    
                texturesLoaded.push(
                    create_texture( mpars, "normalMap", m.mapNormal, m.mapNormalRepeat, m.mapNormalOffset, m.mapNormalWrap, m.mapNormalAnisotropy )
                );
                
            }
    
            if ( m.mapSpecular && texturePath ) {
                
                texturesLoaded.push(
                    create_texture( mpars, "specularMap", m.mapSpecular, m.mapSpecularRepeat, m.mapSpecularOffset, m.mapSpecularWrap, m.mapSpecularAnisotropy )
                );
                
            }
    
            //
    
            if ( m.mapBumpScale ) {
    
                mpars.bumpScale = m.mapBumpScale;
    
            }
    
            return Q.all(texturesLoaded).then(function(){
                // special case for normal mapped material
    
                if ( m.mapNormal ) {
        
                    var shader = THREE.ShaderLib[ "normalmap" ];
                    var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
        
                    uniforms[ "tNormal" ].value = mpars.normalMap;
        
                    if ( m.mapNormalFactor ) {
        
                        uniforms[ "uNormalScale" ].value.set( m.mapNormalFactor, m.mapNormalFactor );
        
                    }
        
                    if ( mpars.map ) {
        
                        uniforms[ "tDiffuse" ].value = mpars.map;
                        uniforms[ "enableDiffuse" ].value = true;
        
                    }
        
                    if ( mpars.specularMap ) {
        
                        uniforms[ "tSpecular" ].value = mpars.specularMap;
                        uniforms[ "enableSpecular" ].value = true;
        
                    }
        
                    if ( mpars.lightMap ) {
        
                        uniforms[ "tAO" ].value = mpars.lightMap;
                        uniforms[ "enableAO" ].value = true;
        
                    }
        
                    // for the moment don't handle displacement texture
        
                    uniforms[ "diffuse" ].value.setHex( mpars.color );
                    uniforms[ "specular" ].value.setHex( mpars.specular );
                    uniforms[ "ambient" ].value.setHex( mpars.ambient );
        
                    uniforms[ "shininess" ].value = mpars.shininess;
        
                    if ( mpars.opacity !== undefined ) {
        
                        uniforms[ "opacity" ].value = mpars.opacity;
        
                    }
        
                    var parameters = { fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader, uniforms: uniforms, lights: true, fog: true };
                    var material = new THREE.ShaderMaterial( parameters );
        
                    if ( mpars.transparent ) {
        
                        material.transparent = true;
        
                    }
        
                } else {
        
                    var material = new THREE[ mtype ]( mpars );
        
                }
        
                if ( m.DbgName !== undefined ) material.name = m.DbgName;
                return material;
            });
            
        }
    
    };
    /**
     * @author mrdoob / http://mrdoob.com/
     * @author alteredq / http://alteredqualia.com/
     */
    
    var JSONLoader = function ( resourceController, showStatus ) {
    
        Loader.call( this, resourceController, showStatus );
    
        this.withCredentials = false;
    
    };
    
    JSONLoader.prototype = Object.create( Loader.prototype );
    
    JSONLoader.prototype.load = function ( url, callback, texturePath ) {
    
        var scope = this;
    
        // todo: unify load API to for easier SceneLoader use
    
        texturePath = texturePath && ( typeof texturePath === "string" ) ? texturePath : this.extractUrlBase( url );
    
        this.onLoadStart();
        this.loadAjaxJSON( this, url, callback, texturePath );
    
    };
    
    JSONLoader.prototype.loadAjaxJSON = function ( context, url, callback, texturePath, callbackProgress ) {
    
        var xhr = new XMLHttpRequest();
    
        var length = 0;
    
        xhr.onreadystatechange = function () {
    
            if ( xhr.readyState === xhr.DONE ) {
    
                if ( xhr.status === 200 || xhr.status === 0 ) {
    
                    if ( xhr.responseText ) {
    
                        var json = JSON.parse( xhr.responseText );
    
                        if ( json.metadata.type === 'scene' ) {
    
                            console.error( 'JSONLoader: "' + url + '" seems to be a Scene. Use THREE.SceneLoader instead.' );
                            return;
    
                        }
    
                        var result = context.parse( json, texturePath );
                        callback( result );
    
                    } else {
    
                        console.error( 'JSONLoader: "' + url + '" seems to be unreachable or the file is empty.' );
    
                    }
    
                    // in context of more complex asset initialization
                    // do not block on single failed file
                    // maybe should go even one more level up
    
                    context.onLoadComplete();
    
                } else {
    
                    console.error( 'JSONLoader: Couldn\'t load "' + url + '" (' + xhr.status + ')' );
    
                }
    
            } else if ( xhr.readyState === xhr.LOADING ) {
    
                if ( callbackProgress ) {
    
                    if ( length === 0 ) {
    
                        length = xhr.getResponseHeader( 'Content-Length' );
    
                    }
    
                    callbackProgress( { total: length, loaded: xhr.responseText.length } );
    
                }
    
            } else if ( xhr.readyState === xhr.HEADERS_RECEIVED ) {
    
                if ( callbackProgress !== undefined ) {
    
                    length = xhr.getResponseHeader( "Content-Length" );
    
                }
    
            }
    
        };
    
        xhr.open( "GET", url, true );
        xhr.withCredentials = this.withCredentials;
        xhr.send( null );
    
    };
    
    JSONLoader.prototype.parse = function ( json, texturePath ) {
    
        var scope = this,
        geometry = new THREE.Geometry(),
        scale = ( json.scale !== undefined ) ? 1.0 / json.scale : 1.0;
    
        parseModel( scale );
    
        parseSkin();
        parseMorphing( scale );
    
        geometry.computeCentroids();
        geometry.computeFaceNormals();
        geometry.computeBoundingSphere();
    
        function parseModel( scale ) {
    
            function isBitSet( value, position ) {
    
                return value & ( 1 << position );
    
            }
    
            var i, j, fi,
    
            offset, zLength,
    
            colorIndex, normalIndex, uvIndex, materialIndex,
    
            type,
            isQuad,
            hasMaterial,
            hasFaceVertexUv,
            hasFaceNormal, hasFaceVertexNormal,
            hasFaceColor, hasFaceVertexColor,
    
            vertex, face, faceA, faceB, color, hex, normal,
    
            uvLayer, uv, u, v,
    
            faces = json.faces,
            vertices = json.vertices,
            normals = json.normals,
            colors = json.colors,
    
            nUvLayers = 0;
    
            if ( json.uvs !== undefined ) {
    
                // disregard empty arrays
    
                for ( i = 0; i < json.uvs.length; i++ ) {
    
                    if ( json.uvs[ i ].length ) nUvLayers ++;
    
                }
    
                for ( i = 0; i < nUvLayers; i++ ) {
    
                    geometry.faceVertexUvs[ i ] = [];
    
                }
    
            }
    
            offset = 0;
            zLength = vertices.length;
    
            while ( offset < zLength ) {
    
                vertex = new THREE.Vector3();
    
                vertex.x = vertices[ offset ++ ] * scale;
                vertex.y = vertices[ offset ++ ] * scale;
                vertex.z = vertices[ offset ++ ] * scale;
    
                geometry.vertices.push( vertex );
    
            }
    
            offset = 0;
            zLength = faces.length;
    
            while ( offset < zLength ) {
    
                type = faces[ offset ++ ];
    
    
                isQuad              = isBitSet( type, 0 );
                hasMaterial         = isBitSet( type, 1 );
                hasFaceVertexUv     = isBitSet( type, 3 );
                hasFaceNormal       = isBitSet( type, 4 );
                hasFaceVertexNormal = isBitSet( type, 5 );
                hasFaceColor        = isBitSet( type, 6 );
                hasFaceVertexColor  = isBitSet( type, 7 );
    
                // console.log("type", type, "bits", isQuad, hasMaterial, hasFaceVertexUv, hasFaceNormal, hasFaceVertexNormal, hasFaceColor, hasFaceVertexColor);
    
                if ( isQuad ) {
    
                    faceA = new THREE.Face3();
                    faceA.a = faces[ offset ];
                    faceA.b = faces[ offset + 1 ];
                    faceA.c = faces[ offset + 3 ];
    
                    faceB = new THREE.Face3();
                    faceB.a = faces[ offset + 1 ];
                    faceB.b = faces[ offset + 2 ];
                    faceB.c = faces[ offset + 3 ];
    
                    offset += 4;
    
                    if ( hasMaterial ) {
    
                        materialIndex = faces[ offset ++ ];
                        faceA.materialIndex = materialIndex;
                        faceB.materialIndex = materialIndex;
    
                    }
    
                    // to get face <=> uv index correspondence
    
                    fi = geometry.faces.length;
    
                    if ( hasFaceVertexUv ) {
    
                        for ( i = 0; i < nUvLayers; i++ ) {
    
                            uvLayer = json.uvs[ i ];
    
                            geometry.faceVertexUvs[ i ][ fi ] = [];
                            geometry.faceVertexUvs[ i ][ fi + 1 ] = []
    
                            for ( j = 0; j < 4; j ++ ) {
    
                                uvIndex = faces[ offset ++ ];
    
                                u = uvLayer[ uvIndex * 2 ];
                                v = uvLayer[ uvIndex * 2 + 1 ];
    
                                uv = new THREE.Vector2( u, v );
    
                                if ( j !== 2 ) geometry.faceVertexUvs[ i ][ fi ].push( uv );
                                if ( j !== 0 ) geometry.faceVertexUvs[ i ][ fi + 1 ].push( uv );
    
                            }
    
                        }
    
                    }
    
                    if ( hasFaceNormal ) {
    
                        normalIndex = faces[ offset ++ ] * 3;
    
                        faceA.normal.set(
                            normals[ normalIndex ++ ],
                            normals[ normalIndex ++ ],
                            normals[ normalIndex ]
                        );
    
                        faceB.normal.copy( faceA.normal );
    
                    }
    
                    if ( hasFaceVertexNormal ) {
    
                        for ( i = 0; i < 4; i++ ) {
    
                            normalIndex = faces[ offset ++ ] * 3;
    
                            normal = new THREE.Vector3(
                                normals[ normalIndex ++ ],
                                normals[ normalIndex ++ ],
                                normals[ normalIndex ]
                            );
    
    
                            if ( i !== 2 ) faceA.vertexNormals.push( normal );
                            if ( i !== 0 ) faceB.vertexNormals.push( normal );
    
                        }
    
                    }
    
    
                    if ( hasFaceColor ) {
    
                        colorIndex = faces[ offset ++ ];
                        hex = colors[ colorIndex ];
    
                        faceA.color.setHex( hex );
                        faceB.color.setHex( hex );
    
                    }
    
    
                    if ( hasFaceVertexColor ) {
    
                        for ( i = 0; i < 4; i++ ) {
    
                            colorIndex = faces[ offset ++ ];
                            hex = colors[ colorIndex ];
    
                            if ( i !== 2 ) faceA.vertexColors.push( new THREE.Color( hex ) );
                            if ( i !== 0 ) faceB.vertexColors.push( new THREE.Color( hex ) );
    
                        }
    
                    }
    
                    geometry.faces.push( faceA );
                    geometry.faces.push( faceB );
    
                } else {
    
                    face = new THREE.Face3();
                    face.a = faces[ offset ++ ];
                    face.b = faces[ offset ++ ];
                    face.c = faces[ offset ++ ];
    
                    if ( hasMaterial ) {
    
                        materialIndex = faces[ offset ++ ];
                        face.materialIndex = materialIndex;
    
                    }
    
                    // to get face <=> uv index correspondence
    
                    fi = geometry.faces.length;
    
                    if ( hasFaceVertexUv ) {
    
                        for ( i = 0; i < nUvLayers; i++ ) {
    
                            uvLayer = json.uvs[ i ];
    
                            geometry.faceVertexUvs[ i ][ fi ] = [];
    
                            for ( j = 0; j < 3; j ++ ) {
    
                                uvIndex = faces[ offset ++ ];
    
                                u = uvLayer[ uvIndex * 2 ];
                                v = uvLayer[ uvIndex * 2 + 1 ];
    
                                uv = new THREE.Vector2( u, v );
    
                                geometry.faceVertexUvs[ i ][ fi ].push( uv );
    
                            }
    
                        }
    
                    }
    
                    if ( hasFaceNormal ) {
    
                        normalIndex = faces[ offset ++ ] * 3;
    
                        face.normal.set(
                            normals[ normalIndex ++ ],
                            normals[ normalIndex ++ ],
                            normals[ normalIndex ]
                        );
    
                    }
    
                    if ( hasFaceVertexNormal ) {
    
                        for ( i = 0; i < 3; i++ ) {
    
                            normalIndex = faces[ offset ++ ] * 3;
    
                            normal = new THREE.Vector3(
                                normals[ normalIndex ++ ],
                                normals[ normalIndex ++ ],
                                normals[ normalIndex ]
                            );
    
                            face.vertexNormals.push( normal );
    
                        }
    
                    }
    
    
                    if ( hasFaceColor ) {
    
                        colorIndex = faces[ offset ++ ];
                        face.color.setHex( colors[ colorIndex ] );
    
                    }
    
    
                    if ( hasFaceVertexColor ) {
    
                        for ( i = 0; i < 3; i++ ) {
    
                            colorIndex = faces[ offset ++ ];
                            face.vertexColors.push( new THREE.Color( colors[ colorIndex ] ) );
    
                        }
    
                    }
    
                    geometry.faces.push( face );
    
                }
    
            }
    
        };
    
        function parseSkin() {
    
            if ( json.skinWeights ) {
    
                for ( var i = 0, l = json.skinWeights.length; i < l; i += 2 ) {
    
                    var x = json.skinWeights[ i     ];
                    var y = json.skinWeights[ i + 1 ];
                    var z = 0;
                    var w = 0;
    
                    geometry.skinWeights.push( new THREE.Vector4( x, y, z, w ) );
    
                }
    
            }
    
            if ( json.skinIndices ) {
    
                for ( var i = 0, l = json.skinIndices.length; i < l; i += 2 ) {
    
                    var a = json.skinIndices[ i     ];
                    var b = json.skinIndices[ i + 1 ];
                    var c = 0;
                    var d = 0;
    
                    geometry.skinIndices.push( new THREE.Vector4( a, b, c, d ) );
    
                }
    
            }
    
            geometry.bones = json.bones;
    
            if ( geometry.bones && geometry.bones.length > 0 && ( geometry.skinWeights.length !== geometry.skinIndices.length || geometry.skinIndices.length !== geometry.vertices.length ) ) {
    
                    console.warn( 'When skinning, number of vertices (' + geometry.vertices.length + '), skinIndices (' +
                        geometry.skinIndices.length + '), and skinWeights (' + geometry.skinWeights.length + ') should match.' );
    
            }
    
    
            // could change this to json.animations[0] or remove completely
            
            geometry.animation = json.animation;
            geometry.animations = json.animations;
    
        };
    
        function parseMorphing( scale ) {
    
            if ( json.morphTargets !== undefined ) {
    
                var i, l, v, vl, dstVertices, srcVertices;
    
                for ( i = 0, l = json.morphTargets.length; i < l; i ++ ) {
    
                    geometry.morphTargets[ i ] = {};
                    geometry.morphTargets[ i ].name = json.morphTargets[ i ].name;
                    geometry.morphTargets[ i ].vertices = [];
    
                    dstVertices = geometry.morphTargets[ i ].vertices;
                    srcVertices = json.morphTargets [ i ].vertices;
    
                    for( v = 0, vl = srcVertices.length; v < vl; v += 3 ) {
    
                        var vertex = new THREE.Vector3();
                        vertex.x = srcVertices[ v ] * scale;
                        vertex.y = srcVertices[ v + 1 ] * scale;
                        vertex.z = srcVertices[ v + 2 ] * scale;
    
                        dstVertices.push( vertex );
    
                    }
    
                }
    
            }
    
            if ( json.morphColors !== undefined ) {
    
                var i, l, c, cl, dstColors, srcColors, color;
    
                for ( i = 0, l = json.morphColors.length; i < l; i++ ) {
    
                    geometry.morphColors[ i ] = {};
                    geometry.morphColors[ i ].name = json.morphColors[ i ].name;
                    geometry.morphColors[ i ].colors = [];
    
                    dstColors = geometry.morphColors[ i ].colors;
                    srcColors = json.morphColors [ i ].colors;
    
                    for ( c = 0, cl = srcColors.length; c < cl; c += 3 ) {
    
                        color = new THREE.Color( 0xffaa00 );
                        color.setRGB( srcColors[ c ], srcColors[ c + 1 ], srcColors[ c + 2 ] );
                        dstColors.push( color );
    
                    }
    
                }
    
            }
    
        };
    
        if ( json.materials === undefined ) {
    
            return Q.resolve({ geometry: geometry });
    
        } else {
            var materials = this.initMaterials( json.materials, texturePath );
    
            return Q.all(materials).then((function(materials){
                if ( this.needsTangents( materials ) ) {
    
                    geometry.computeTangents();
        
                }
                return { geometry: geometry, materials: materials };
            }).bind(this));
    
            
    
        }
    
    };
    return JSONLoader;
});