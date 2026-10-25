import { Color, PlaneGeometry, ShaderMaterial, Sphere, Vector3 } from 'three'

/** Two triangles instead of 80 per puff. The vertex shader faces the camera,
 * preserving every existing instance center, age, scale and capacity. */
export const SOFT_SMOKE_GEOMETRY = new PlaneGeometry(2, 2)
// Camera facing rotation can point the quad in any direction. This conservative
// sphere remains valid under every instance's largest axis scale.
export const SMOKE_PRESENTATION_EXTENT = [1.35, 1.65] as const
SOFT_SMOKE_GEOMETRY.boundingSphere = new Sphere(new Vector3(), Math.hypot(...SMOKE_PRESENTATION_EXTENT))
export function createSoftSmokeMaterial(color: string, opacity: number) {
  return new ShaderMaterial({
    uniforms: { uTint: { value: new Color(color) }, uOpacity: { value: opacity } },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    forceSinglePass: true,
    vertexShader: `varying vec2 vPuff; varying float vSeed;
      void main(){
        vPuff=uv*2.0-1.0;
        mat4 particle=modelMatrix;
        #ifdef USE_INSTANCING
        particle=modelMatrix*instanceMatrix;
        #endif
        vec4 center=particle*vec4(0.0,0.0,0.0,1.0);
        vSeed=dot(center.xyz,vec3(.013,.017,.019));
        vec2 extent=vec2(max(length(particle[0].xyz),length(particle[2].xyz)),length(particle[1].xyz));
        vec4 viewCenter=viewMatrix*center;
        viewCenter.xy+=position.xy*extent*vec2(1.35,1.65);
        gl_Position=projectionMatrix*viewCenter;
      }`,
    fragmentShader: `uniform vec3 uTint; uniform float uOpacity; varying vec2 vPuff; varying float vSeed;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}
      void main(){
        vec2 p=vPuff;
        float n=noise(p*3.5+vSeed)*.65+noise(p*7.0-vSeed)*.35;
        float r=length(p*(1.0+(.5-n)*.20));
        float feather=1.0-smoothstep(.24,1.0,r);
        float density=feather*mix(.62,1.0,n);
        float alpha=uOpacity*density;
        if(alpha<.003) discard;
        vec3 lit=uTint+vec3(.040,.047,.050)*smoothstep(-.6,.9,p.y)+vec3(.012)*n;
        gl_FragColor=vec4(lit,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  })
}

export const SOFT_FLAME_GEOMETRY = new PlaneGeometry(1, 1).translate(0, 0.5, 0)
SOFT_FLAME_GEOMETRY.computeBoundingSphere()
/** An anchored, tapered flame with an irregular translucent edge. The authored
 * source flicker and scale still drive it; no independent wall clock. */
export function createSoftFlameMaterial(color: string, opacity: number) {
  return new ShaderMaterial({
    uniforms: { uTint: { value: new Color(color) }, uOpacity: { value: opacity } },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    forceSinglePass: true,
    vertexShader: `varying vec2 vFlame; varying float vSeed; void main(){
      vFlame=uv;
      mat4 particle=modelMatrix;
      #ifdef USE_INSTANCING
      particle=modelMatrix*instanceMatrix;
      #endif
      vSeed=particle[0].x+particle[2].x;
      vec4 p=viewMatrix*particle*vec4(0,0,0,1);
      p.xy+=position.xy*vec2(max(length(particle[0].xyz),length(particle[2].xyz)),length(particle[1].xyz));
      gl_Position=projectionMatrix*p;
    }`,
    fragmentShader: `uniform vec3 uTint; uniform float uOpacity; varying vec2 vFlame; varying float vSeed;
      void main(){float y=vFlame.y;float bend=sin(y*11.0+vSeed*3.0)*.055*y;
      float width=(1.0-y)*(.42+.07*sin(y*27.0+vSeed*8.0));
      float edge=1.0-smoothstep(width*.4,width,abs(vFlame.x-.5-bend));
      float alpha=edge*(1.0-smoothstep(.78,1.0,y))*smoothstep(0.0,.045,y)*uOpacity;
      if(alpha<.004)discard;
      vec3 color=mix(vec3(1.6,.8,.14),uTint,clamp(y*1.8,0.0,1.0));
      gl_FragColor=vec4(color,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  })
}

/** Legacy centered radius-one cones keep their exact base/top convention. */
export const SOFT_CENTERED_FLAME_GEOMETRY = new PlaneGeometry(2, 1)
SOFT_CENTERED_FLAME_GEOMETRY.computeBoundingSphere()
