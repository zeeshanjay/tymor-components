import * as THREE from "three";

/*
  FluidSim — a real GPU Navier-Stokes solver (Stam "Stable Fluids").
  ------------------------------------------------------------------
  This is the technique sidewave.it uses. Per frame it runs, in order:

    1. curl            – vorticity (rot of the velocity field)
    2. vorticity       – confinement force that re-injects small eddies
    3. divergence      – how much the field is (in)compressible
    4. clear pressure  – decay the previous pressure a little
    5. pressure        – Jacobi iterations solving  ∇²p = div(v)
    6. gradient subtr. – v -= ∇p   (makes the field divergence-free)
    7. advect          – the field transports itself (with dissipation)
    8. splat           – inject momentum at the pointer (on demand)

  The divergence-free projection (steps 3-6) is what makes the fluid
  SWIRL and SPREAD smoothly instead of "popping" at the cursor.

  Output: a HalfFloat velocity texture (xy = velocity) that the main
  shader uses to refract the background.
*/

const baseVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const advectionShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2  texelSize;
  uniform float dt;
  uniform float dissipation;
  void main() {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    vec4 result = texture2D(uSource, coord);
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`;

const divergenceShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;
  void main() {
    float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
    float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    // free-slip boundaries
    if (vUv.x - texelSize.x < 0.0) { L = -C.x; }
    if (vUv.x + texelSize.x > 1.0) { R = -C.x; }
    if (vUv.y + texelSize.y > 1.0) { T = -C.y; }
    if (vUv.y - texelSize.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const curlShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;
  void main() {
    float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).y;
    float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).y;
    float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).x;
    float curl = 0.5 * ((R - L) - (T - B));
    gl_FragColor = vec4(curl, 0.0, 0.0, 1.0);
  }
`;

const vorticityShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform vec2  texelSize;
  uniform float curl;
  uniform float dt;
  void main() {
    float L = texture2D(uCurl, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uCurl, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture2D(uCurl, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture2D(uCurl, vUv - vec2(0.0, texelSize.y)).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 1e-4;
    force *= curl * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vel += force * dt;
    vel = clamp(vel, -1000.0, 1000.0);
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

const pressureShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 texelSize;
  void main() {
    float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;
  void main() {
    float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vel -= 0.5 * vec2(R - L, T - B);
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

const clearShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;
  void main() {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const splatShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3  color;
  uniform vec2  point;
  uniform float radius;
  void main() {
    vec2 p = vUv - point;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

function makeRT(w: number, h: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

class DoubleRT {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  constructor(w: number, h: number) {
    this.read = makeRT(w, h);
    this.write = makeRT(w, h);
  }
  swap() {
    const t = this.read;
    this.read = this.write;
    this.write = t;
  }
  setSize(w: number, h: number) {
    this.read.setSize(w, h);
    this.write.setSize(w, h);
  }
  dispose() {
    this.read.dispose();
    this.write.dispose();
  }
}

export type FluidConfig = {
  simResolution: number;     // grid height (width scales with aspect)
  velocityDissipation: number;
  pressure: number;          // pressure decay per frame (0..1)
  pressureIterations: number;
  curl: number;              // vorticity strength
  splatRadius: number;       // 0..1 (relative)
  splatForce: number;        // momentum per pointer delta
};

// Hard cap on the simulation grid's largest axis (downsampling guardrail).
const SIM_MAX = 256;

const DEFAULTS: FluidConfig = {
  simResolution: SIM_MAX,
  velocityDissipation: 1.6,
  pressure: 0.7,
  pressureIterations: 22,
  curl: 4,
  splatRadius: 0.012,
  splatForce: 2600,
};

export class FluidSim {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: THREE.Mesh;
  private mats: Record<string, THREE.ShaderMaterial>;
  private velocity!: DoubleRT;
  private pressure!: DoubleRT;
  private divergenceRT!: THREE.WebGLRenderTarget;
  private curlRT!: THREE.WebGLRenderTarget;
  private texelSize = new THREE.Vector2(1, 1);
  private simW = 2;
  private simH = 2;
  private aspect = 1;
  config: FluidConfig;

  constructor(renderer: THREE.WebGLRenderer, config: Partial<FluidConfig> = {}) {
    this.renderer = renderer;
    this.config = { ...DEFAULTS, ...config };

    const make = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) =>
      new THREE.ShaderMaterial({
        vertexShader: baseVertex,
        fragmentShader,
        uniforms,
        depthTest: false,
        depthWrite: false,
      });

    this.mats = {
      advection: make(advectionShader, {
        uVelocity: { value: null },
        uSource: { value: null },
        texelSize: { value: this.texelSize },
        dt: { value: 0.016 },
        dissipation: { value: this.config.velocityDissipation },
      }),
      divergence: make(divergenceShader, {
        uVelocity: { value: null },
        texelSize: { value: this.texelSize },
      }),
      curl: make(curlShader, {
        uVelocity: { value: null },
        texelSize: { value: this.texelSize },
      }),
      vorticity: make(vorticityShader, {
        uVelocity: { value: null },
        uCurl: { value: null },
        texelSize: { value: this.texelSize },
        curl: { value: this.config.curl },
        dt: { value: 0.016 },
      }),
      pressure: make(pressureShader, {
        uPressure: { value: null },
        uDivergence: { value: null },
        texelSize: { value: this.texelSize },
      }),
      gradient: make(gradientSubtractShader, {
        uPressure: { value: null },
        uVelocity: { value: null },
        texelSize: { value: this.texelSize },
      }),
      clear: make(clearShader, {
        uTexture: { value: null },
        value: { value: this.config.pressure },
      }),
      splat: make(splatShader, {
        uTarget: { value: null },
        aspectRatio: { value: 1 },
        color: { value: new THREE.Vector3() },
        point: { value: new THREE.Vector2() },
        radius: { value: 0.0001 },
      }),
    };

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mats.advection);
    this.scene.add(this.quad);

    // Allocate buffers immediately so velocityTexture is valid pre-resize.
    this.simW = this.config.simResolution;
    this.simH = this.config.simResolution;
    this.texelSize.set(1 / this.simW, 1 / this.simH);
    this.velocity = new DoubleRT(this.simW, this.simH);
    this.pressure = new DoubleRT(this.simW, this.simH);
    this.divergenceRT = makeRT(this.simW, this.simH);
    this.curlRT = makeRT(this.simW, this.simH);
  }

  resize(displayWidth: number, displayHeight: number) {
    this.aspect = displayWidth / displayHeight;
    // Downsampling guardrail: clamp the largest axis to SIM_MAX (256) so the
    // solver stays cheap; LinearFilter upscales it smoothly over the scene.
    const max = Math.min(this.config.simResolution, SIM_MAX);
    if (this.aspect >= 1) {
      this.simW = max;
      this.simH = Math.max(2, Math.round(max / this.aspect));
    } else {
      this.simH = max;
      this.simW = Math.max(2, Math.round(max * this.aspect));
    }
    this.texelSize.set(1 / this.simW, 1 / this.simH);
    this.velocity.setSize(this.simW, this.simH);
    this.pressure.setSize(this.simW, this.simH);
    this.divergenceRT.setSize(this.simW, this.simH);
    this.curlRT.setSize(this.simW, this.simH);
  }

  private blit(target: THREE.WebGLRenderTarget | null, material: THREE.ShaderMaterial) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  // x, y in 0..1 uv (y up). dx, dy = pointer velocity in uv space.
  splat(x: number, y: number, dx: number, dy: number) {
    const m = this.mats.splat;
    const f = this.config.splatForce;
    m.uniforms.uTarget.value = this.velocity.read.texture;
    m.uniforms.aspectRatio.value = this.aspect;

    // Offset the splat position slightly behind the current cursor position
    // based on the direction of pointer velocity (dx, dy).
    const splatX = x - dx * 1.2;
    const splatY = y - dy * 1.2;

    (m.uniforms.point.value as THREE.Vector2).set(splatX, splatY);
    (m.uniforms.color.value as THREE.Vector3).set(dx * f, dy * f, 0);
    m.uniforms.radius.value = this.config.splatRadius / 100.0;
    this.blit(this.velocity.write, m);
    this.velocity.swap();

    this.renderer.setRenderTarget(null);
  }

  update(dt: number) {
    if (!this.velocity) return;
    const dtc = Math.min(dt, 0.016666);

    // 1. curl
    this.mats.curl.uniforms.uVelocity.value = this.velocity.read.texture;
    this.blit(this.curlRT, this.mats.curl);

    // 2. vorticity confinement
    this.mats.vorticity.uniforms.uVelocity.value = this.velocity.read.texture;
    this.mats.vorticity.uniforms.uCurl.value = this.curlRT.texture;
    this.mats.vorticity.uniforms.curl.value = this.config.curl;
    this.mats.vorticity.uniforms.dt.value = dtc;
    this.blit(this.velocity.write, this.mats.vorticity);
    this.velocity.swap();

    // 3. divergence
    this.mats.divergence.uniforms.uVelocity.value = this.velocity.read.texture;
    this.blit(this.divergenceRT, this.mats.divergence);

    // 4. decay previous pressure
    this.mats.clear.uniforms.uTexture.value = this.pressure.read.texture;
    this.mats.clear.uniforms.value.value = this.config.pressure;
    this.blit(this.pressure.write, this.mats.clear);
    this.pressure.swap();

    // 5. solve pressure (Jacobi)
    this.mats.pressure.uniforms.uDivergence.value = this.divergenceRT.texture;
    for (let i = 0; i < this.config.pressureIterations; i++) {
      this.mats.pressure.uniforms.uPressure.value = this.pressure.read.texture;
      this.blit(this.pressure.write, this.mats.pressure);
      this.pressure.swap();
    }

    // 6. subtract pressure gradient -> divergence-free velocity
    this.mats.gradient.uniforms.uPressure.value = this.pressure.read.texture;
    this.mats.gradient.uniforms.uVelocity.value = this.velocity.read.texture;
    this.blit(this.velocity.write, this.mats.gradient);
    this.velocity.swap();

    // 7. advect velocity through itself
    this.mats.advection.uniforms.uVelocity.value = this.velocity.read.texture;
    this.mats.advection.uniforms.uSource.value = this.velocity.read.texture;
    this.mats.advection.uniforms.dissipation.value = this.config.velocityDissipation;
    this.mats.advection.uniforms.dt.value = dtc;
    this.blit(this.velocity.write, this.mats.advection);
    this.velocity.swap();

    this.renderer.setRenderTarget(null);
  }

  get velocityTexture(): THREE.Texture {
    return this.velocity.read.texture;
  }

  dispose() {
    this.quad.geometry.dispose();
    Object.values(this.mats).forEach((m) => m.dispose());
    this.velocity?.dispose();
    this.pressure?.dispose();
    this.divergenceRT?.dispose();
    this.curlRT?.dispose();
  }
}
