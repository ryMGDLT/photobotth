export class WebGLVHSRenderer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private videoTexture: WebGLTexture | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;

  // Uniform locations
  private timeLocation: WebGLUniformLocation | null = null;
  private resolutionLocation: WebGLUniformLocation | null = null;
  private rotationLocation: WebGLUniformLocation | null = null;
  private videoLocation: WebGLUniformLocation | null = null;

  private startTime: number = 0;
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private video: HTMLVideoElement,
    private getRotation: () => number
  ) {
    this.init();
  }

  private init() {
    const gl = this.canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }
    this.gl = gl;

    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      
      varying vec2 v_texCoord;
      uniform sampler2D u_video;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_rotation;

      // Noise function
      float rand(vec2 co) {
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      vec2 rotateUV(vec2 uv, float rotation) {
        float mid = 0.5;
        float rad = radians(rotation);
        float s = sin(rad);
        float c = cos(rad);
        
        vec2 translated = uv - vec2(mid);
        mat2 rotMat = mat2(c, -s, s, c);
        
        // When rotated 90 or 270, aspect ratio changes relative to UV, 
        // but for a simple full screen quad mapping to video texture,
        // we can just rotate the UVs if we pre-scale them, or just use 
        // standard rotation if aspect is handled in canvas size.
        vec2 rotated = rotMat * translated;
        return rotated + vec2(mid);
      }

      void main() {
        // Handle Rotation
        vec2 uv = rotateUV(v_texCoord, u_rotation);
        
        // 1. Chromatic Aberration
        float shiftAmount = 0.005 + 0.002 * sin(u_time * 2.0);
        vec2 shift = vec2(shiftAmount, 0.0);
        
        // 2. Scanlines
        float scanline = sin(uv.y * 800.0 + u_time * 10.0) * 0.04;
        
        // 3. Tape noise/jitter
        float jitter = (rand(vec2(uv.y, u_time)) - 0.5) * 0.002;
        // Occasional large jitter
        if (rand(vec2(u_time, u_time)) > 0.98) {
          jitter *= 10.0;
        }
        
        vec2 uvR = uv + shift + vec2(jitter, 0.0);
        vec2 uvG = uv + vec2(jitter, 0.0);
        vec2 uvB = uv - shift + vec2(jitter, 0.0);
        
        // Bounds check to avoid wrapping artifacts from jitter
        uvR = clamp(uvR, 0.0, 1.0);
        uvG = clamp(uvG, 0.0, 1.0);
        uvB = clamp(uvB, 0.0, 1.0);

        float r = texture2D(u_video, uvR).r;
        float g = texture2D(u_video, uvG).g;
        float b = texture2D(u_video, uvB).b;
        
        vec3 color = vec3(r, g, b);
        
        // 4. Contrast and Brightness adjustment for VHS look
        color = clamp((color - 0.5) * 1.2 + 0.5, 0.0, 1.0);
        
        // 5. Film Grain / Static
        float staticNoise = rand(uv + u_time) * 0.1;
        color += staticNoise;
        
        // Apply scanline darkening
        color -= scanline;
        
        // Sepia tint for vintage feel
        vec3 sepiaColor = vec3(
          (color.r * 0.393) + (color.g * 0.769) + (color.b * 0.189),
          (color.r * 0.349) + (color.g * 0.686) + (color.b * 0.168),
          (color.r * 0.272) + (color.g * 0.534) + (color.b * 0.131)
        );
        
        // Mix between original and sepia
        color = mix(color, sepiaColor, 0.3);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    this.program = this.createProgram(gl, vertexShader, fragmentShader);
    if (!this.program) return;

    // Buffer setup
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    const texCoords = [
      0.0, 1.0,
      1.0, 1.0,
      0.0, 0.0,
      0.0, 0.0,
      1.0, 1.0,
      1.0, 0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    // Texture setup
    this.videoTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Uniforms
    this.timeLocation = gl.getUniformLocation(this.program, "u_time");
    this.resolutionLocation = gl.getUniformLocation(this.program, "u_resolution");
    this.rotationLocation = gl.getUniformLocation(this.program, "u_rotation");
    this.videoLocation = gl.getUniformLocation(this.program, "u_video");

    this.startTime = performance.now();
  }

  private createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  public start() {
    this.isDestroyed = false;
    const render = (time: number) => {
      if (this.isDestroyed) return;
      this.renderFrame(time);
      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  public stop() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public renderFrame(time?: number) {
    const gl = this.gl;
    if (!gl || !this.program || !this.video) return;
    
    // Ensure video has dimensions
    if (this.video.videoWidth === 0 || this.video.videoHeight === 0) return;

    // Sync canvas size to video size
    if (this.canvas.width !== this.video.videoWidth || this.canvas.height !== this.video.videoHeight) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.useProgram(this.program);

    // Update texture with current video frame
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
    if (this.videoLocation !== null) gl.uniform1i(this.videoLocation, 0);

    // Update uniforms
    const currentTime = time !== undefined ? time : performance.now();
    if (this.timeLocation !== null) gl.uniform1f(this.timeLocation, (currentTime - this.startTime) / 1000.0);
    if (this.resolutionLocation !== null) gl.uniform2f(this.resolutionLocation, gl.canvas.width, gl.canvas.height);
    if (this.rotationLocation !== null) gl.uniform1f(this.rotationLocation, this.getRotation());

    // Bind position buffer
    const positionLocation = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Bind texcoord buffer
    const texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");
    gl.enableVertexAttribArray(texCoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public destroy() {
    this.stop();
    if (this.gl) {
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.videoTexture) this.gl.deleteTexture(this.videoTexture);
      if (this.positionBuffer) this.gl.deleteBuffer(this.positionBuffer);
      if (this.texCoordBuffer) this.gl.deleteBuffer(this.texCoordBuffer);
    }
  }
}
