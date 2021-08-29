uniform sampler2D T;
uniform vec4 t;


// ==================================================================================================

const float track = 1.0;

// Merge two signed distances together while smoothing sharp edges in their negative space
float roundMerge(float a, float b)
{
    return -length(min(vec2(a, b), 0.)) + max(min(a, b), 0.);
}

// For every integer x, this gives some pseudorandom value in the range [0,1)
float rand(float x)
{
    return fract(sin(track+11.*floor(x+11.)) * (22.+track));
}

// Signed distance function for the divot closest to p.x + b. Parameter p is in world space
float divot(vec2 p, float b)
{
    // Pick a random radius for the divot
    float r = .7 + .6*rand(p.x + b);

    // Move in to the local space of the divot, offset vertically by some random amount
    p = vec2(
        abs( mod(p.x+.5,1.) - b ),
        p.y + rand(p.x+b+9.)*track/7. + .5 - track/10.
    );

    // Uneven capsule distance function https://www.shadertoy.com/view/4lcBWn
    return dot(p, vec2(.3,.95)) < 0.
        ? length(p) - r
        : dot(p, vec2(.95,-.3)) - r;
}

// Total signed distance function for the world. Parameter p is in world space
float map(vec2 p)
{
    p *= 0.1;
    p.y *= -1.0;

    return min(
        // Cliff at the start of the level
        p.x - .7*p.y - 3., 

        // The three closest divots to p
        roundMerge(
            roundMerge(
                divot(p,  .5),
                divot(p, -.5)
            ),
            divot(p, 1.5)
        )
    ) / 0.1;
}

// ==================================================================================================



void main() {
    if( t.z == 0.0 ) {
        gl_FragColor = vec4(map(t.xy));
        return;
    }

    float zoom = t.z * 21.0; // cameraZoom * baseScale;
    vec2 worldPos = (gl_FragCoord.xy - (0.5*vec2(1024,768)));
    worldPos.y *= -1.0;
    worldPos = worldPos / zoom + t.xy;

    vec2 uv = gl_FragCoord.xy/vec2(1024,768);
    uv.y = 1.0 - uv.y;
    float samp = texture2D(T, uv).r;
    float time = t.w * 0.02;
    vec3 colA = 0.5 + 0.5*cos(time+uv.xyx+vec3(0,2,4));
    vec3 colB = 1.0 - colA; // 0.5 + 0.5*cos(time+3.0+uv.xyx+vec3(0,2,4));

    if( map(worldPos) > 0.0 ){
    //if( worldPos.y > 10.0 ) {
        samp = 1.0;
    }

    gl_FragColor = vec4(mix(colA,colB,samp),1.0);
}
