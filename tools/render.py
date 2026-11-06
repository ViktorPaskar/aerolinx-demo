# Cycles product shots. Usage:
#   blender -b -P tools/render.py -- <glb_dir> <out_dir> [name,name] [samples] [size]
import bpy, sys, os, math, re, time
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT = argv[0], argv[1]
ONLY = argv[2].split(',') if len(argv) > 2 and argv[2] != 'all' else None
SAMPLES = int(argv[3]) if len(argv) > 3 else 96
SIZE = int(argv[4]) if len(argv) > 4 else 900
os.makedirs(OUT, exist_ok=True)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
cy = scene.cycles
cy.samples = SAMPLES
cy.use_denoising = True
cy.denoiser = 'OPENIMAGEDENOISE'
cy.max_bounces = 8
cy.use_adaptive_sampling = True
cy.adaptive_threshold = .02
# Use the GPU when Blender can see one, otherwise CPU.
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'HIP'
    prefs.get_devices()
    devs = [d for d in prefs.devices if d.type == 'HIP']
    if devs:
        for d in prefs.devices: d.use = d.type == 'HIP'
        cy.device = 'GPU'
    print('DEVICE', cy.device, [d.name for d in devs])
except Exception as e:
    print('GPU unavailable', e)
scene.render.resolution_x = scene.render.resolution_y = SIZE
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.quality = 84
scene.render.image_settings.color_mode = 'RGB'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - High Contrast'
scene.view_settings.exposure = .1

BACKDROP = (.42, .425, .435, 1)

def nodes(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(p.outputs[0], o.inputs[0])
    return m, nt, p

def surface(name, color, metal, rough, rough_var=.1, bump=.0, noise_scale=180, grain=None, bevel=.006, coat=0):
    """A Principled shader with noise-driven roughness, micro bump and softened edges."""
    m, nt, p = nodes(name)
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Coat Weight'].default_value = coat
    tc = nt.nodes.new('ShaderNodeTexCoord')
    src = tc.outputs['Object']
    if grain:
        mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = grain
        nt.links.new(src, mp.inputs[0]); src = mp.outputs[0]
    n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = noise_scale; n.inputs['Detail'].default_value = 7
    nt.links.new(src, n.inputs['Vector'])
    big = nt.nodes.new('ShaderNodeTexNoise'); big.inputs['Scale'].default_value = 5; big.inputs['Detail'].default_value = 4
    nt.links.new(tc.outputs['Object'], big.inputs['Vector'])
    mix = nt.nodes.new('ShaderNodeMath'); mix.operation = 'MULTIPLY_ADD'
    nt.links.new(big.outputs[0], mix.inputs[0]); mix.inputs[1].default_value = .6; nt.links.new(n.outputs[0], mix.inputs[2])
    rmp = nt.nodes.new('ShaderNodeMapRange'); rmp.inputs['From Min'].default_value = .35; rmp.inputs['From Max'].default_value = 1.0
    rmp.inputs['To Min'].default_value = rough - rough_var; rmp.inputs['To Max'].default_value = rough + rough_var
    nt.links.new(mix.outputs[0], rmp.inputs['Value']); nt.links.new(rmp.outputs[0], p.inputs['Roughness'])
    # Slight colour drift so large panels are not perfectly uniform.
    hsv = nt.nodes.new('ShaderNodeHueSaturation'); hsv.inputs['Color'].default_value = (*color, 1)
    vr = nt.nodes.new('ShaderNodeMapRange'); vr.inputs['To Min'].default_value = .93; vr.inputs['To Max'].default_value = 1.06
    nt.links.new(big.outputs[0], vr.inputs['Value']); nt.links.new(vr.outputs[0], hsv.inputs['Value'])
    nt.links.new(hsv.outputs[0], p.inputs['Base Color'])
    bev = nt.nodes.new('ShaderNodeBevel'); bev.samples = 4; bev.inputs['Radius'].default_value = bevel
    last = bev.outputs[0]
    if bump > 0:
        b = nt.nodes.new('ShaderNodeBump'); b.inputs['Strength'].default_value = bump; b.inputs['Distance'].default_value = .004
        nt.links.new(n.outputs[0], b.inputs['Height']); nt.links.new(bev.outputs[0], b.inputs['Normal']); last = b.outputs[0]
    nt.links.new(last, p.inputs['Normal'])
    return m

LIB = {
    'titanium': lambda: surface('titanium', (.5, .5, .51), 1, .34, .1, .22, 240, (1, 1, 14)),
    'alu':      lambda: surface('alu', (.56, .56, .56), 1, .38, .12, .35, 260),
    'polished': lambda: surface('polished', (.62, .62, .62), 1, .17, .05, .1, 400, (1, 1, 20)),
    'dark':     lambda: surface('dark', (.13, .135, .14), .85, .44, .08, .08, 300),
    'graphite': lambda: surface('graphite', (.035, .036, .04), .3, .5, .08, .12, 400),
    'wrinkle':  lambda: surface('wrinkle', (.028, .029, .03), 0, .62, .08, .9, 620, None, .008),
    'nickel':   lambda: surface('nickel', (.48, .4, .29), 1, .36, .12, .25, 300),
    'copper':   lambda: surface('copper', (.55, .32, .18), 1, .42, .1, .1, 260),
    'brass':    lambda: surface('brass', (.5, .37, .16), 1, .3, .08, .16, 320),
    'satin':    lambda: surface('satin', (.1, .1, .11), .4, .4, .05, .02, 300),
    'paint':    lambda: surface('paint', (.78, .78, .78), 0, .35, .05, .03, 300, None, .006, .5),
    'white':    lambda: surface('white', (.74, .74, .71), 0, .46, .06, .03, 300, None, .006),
    'liner':    lambda: surface('liner', (.03, .03, .03), .2, .7, .05, .1, 300),
    'rubber':   lambda: surface('rubber', (.018, .018, .02), 0, .66, .08, .35, 700),
    'carbon':   lambda: surface('carbon', (.045, .045, .05), .35, .55, .1, .5, 500),
    'anod':     lambda: surface('anod', (.08, .16, .3), .9, .36, .05, .04, 300),
    'primer':   lambda: surface('primer', (.22, .26, .1), .05, .55, .08, .15, 420, None, .008),
    'red':      lambda: surface('red', (.45, .04, .03), 0, .38, .04, .02, 300),
    'orange':   lambda: surface('orange', (.75, .19, .025), 0, .4, .05, .04, 300, None, .01, .3),
    'oxygreen': lambda: surface('oxygreen', (.035, .15, .07), .1, .38, .05, .03, 300, None, .006, .4),
    'braid':    lambda: surface('braid', (.34, .34, .35), 1, .46, .1, 1.5, 1100, (1, 1, 1)),
}
CACHE = {}
def lib(name):
    if name not in CACHE: CACHE[name] = LIB[name]()
    return CACHE[name]

def emissive(name, power):
    m, nt, p = nodes(name)
    nt.nodes.remove(p)
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (1, .93, .82, 1); e.inputs[1].default_value = power
    nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs[0]); return m

def glass():
    m, nt, p = nodes('glass')
    p.inputs['Transmission Weight'].default_value = 1; p.inputs['Roughness'].default_value = .02; p.inputs['IOR'].default_value = 1.5
    return m

def clear():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)

def add_area(name, loc, target, size, power, color=(1, 1, 1), size_y=None):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = power; d.color = color; d.shape = 'RECTANGLE'; d.size = size; d.size_y = size_y or size
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o); o.location = loc
    v = Vector(target) - Vector(loc); o.rotation_euler = v.to_track_quat('-Z', 'Y').to_euler()
    return o

def stage(R):
    # Curved seamless backdrop, like a photo studio sweep.
    pts, n = [], 18
    far, h, r = 14 * R, 14 * R, 3.2 * R
    verts, faces = [], []
    prof = [(-far * 1.0, 0)]
    prof += [(far * -.0, 0)] if False else []
    prof = [(14 * R, 0), (0, 0)]
    prof = [(16 * R, 0), (-6 * R, 0)]
    for i in range(1, n + 1):
        a = i / n * math.pi / 2
        prof.append((-6 * R - r * math.sin(a), r * (1 - math.cos(a))))
    prof.append((-6 * R - r, 16 * R))
    w = 30 * R
    for (y, z) in prof:
        verts += [(-w, -y, z), (w, -y, z)]
    for i in range(len(prof) - 1):
        a = i * 2; faces.append((a, a + 1, a + 3, a + 2))
    me = bpy.data.meshes.new('sweep'); me.from_pydata(verts, [], faces); me.update()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new('sweep', me); bpy.context.collection.objects.link(ob)
    m, nt, pr = nodes('sweep'); pr.inputs['Base Color'].default_value = BACKDROP; pr.inputs['Roughness'].default_value = .55
    me.materials.append(m)
    world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (.8, .82, .86, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = .1
    # Dark flags give metal something to reflect, so it shows form instead of glowing white.
    for name, loc, size in (('flag1', (-5.5 * R, -2 * R, 2.2 * R), 5 * R), ('flag2', (4.2 * R, -5.5 * R, 2 * R), 4 * R)):
        bpy.ops.mesh.primitive_plane_add(size=size, location=loc)
        f = bpy.context.active_object; f.name = name
        f.rotation_euler = (Vector((0, 0, .5)) - Vector(loc)).to_track_quat('Z', 'Y').to_euler()
        fm, _, fp = nodes(name); fp.inputs['Base Color'].default_value = (.008, .008, .009, 1); fp.inputs['Roughness'].default_value = .8
        f.data.materials.append(fm)
        f.visible_camera = False
    # Key, cool fill, rim strip, and a low kicker.
    add_area('key', (-3.2 * R, -2.6 * R, 5.6 * R), (0, 0, .4 * R), 4.2 * R, 640 * R * R, (1, .97, .93))
    add_area('fill', (5.6 * R, -1.2 * R, 2.4 * R), (0, 0, .4 * R), 1.4 * R, 150 * R * R, (.9, .94, 1), 6 * R)
    add_area('rim', (1.2 * R, 3.8 * R, 3.8 * R), (0, 0, .7 * R), 1.2 * R, 420 * R * R, (1, 1, 1), 6 * R)

VIEWS = {
    # name: (azimuth added to the model, camera elevation, distance factor, look-height factor)
    '1': (0, 14, 1.0, .5),
    '2': (-74, 22, 1.0, .5),
    '3': (34, 30, .58, .62),
}

def render_model(name):
    clear()
    for m in [x for x in bpy.data.materials if x.users == 0]:
        if m not in CACHE.values(): bpy.data.materials.remove(m)
    bpy.ops.import_scene.gltf(filepath=os.path.join(GLB, name + '.glb'))
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    empties = [o for o in bpy.context.scene.objects if o.type == 'EMPTY']
    # Bake parent transforms so we can spin and place freely.
    for o in objs:
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    for e in empties: bpy.data.objects.remove(e, do_unlink=True)
    for o in objs:
        for i, slot in enumerate(o.material_slots):
            base = re.sub(r'\.\d+$', '', slot.material.name) if slot.material else ''
            if base in LIB: slot.material = lib(base)
            elif base == 'led': slot.material = CACHE.setdefault('led', emissive('led', 7))
            elif base == 'glass': slot.material = CACHE.setdefault('glass', glass())
    pivot = bpy.data.objects.new('pivot', None); bpy.context.collection.objects.link(pivot)
    for o in objs:
        o.parent = pivot
    # Measure, normalise to radius 1 and stand it on the floor.
    bpy.context.view_layer.update()
    def bounds():
        lo, hi = Vector((1e9, 1e9, 1e9)), Vector((-1e9, -1e9, -1e9))
        for o in objs:
            for c in o.bound_box:
                w = o.matrix_world @ Vector(c)
                lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
        return lo, hi
    lo, hi = bounds()
    ctr = (lo + hi) / 2
    fit = max(hi.x - lo.x, hi.y - lo.y, hi.z - lo.z)
    k = 2 / fit
    for o in objs:
        o.location = (o.location - ctr) * 1
    pivot.scale = (k, k, k)
    stage(1.0)
    cam_d = bpy.data.cameras.new('c'); cam_d.lens = 85; cam_d.sensor_width = 36
    cam = bpy.data.objects.new('c', cam_d); bpy.context.collection.objects.link(cam); scene.camera = cam
    cam_d.dof.use_dof = True; cam_d.dof.aperture_fstop = 11
    made = []
    for view, (az, el, dist, lookh) in VIEWS.items():
        pivot.rotation_euler = (0, 0, math.radians(az))
        pivot.location = (0, 0, 0)
        bpy.context.view_layer.update()
        lo, hi = bounds()
        pivot.location = (0, 0, -lo.z + .001)   # rest on the floor
        bpy.context.view_layer.update()
        lo, hi = bounds()
        c = (lo + hi) / 2
        size = max(hi.x - lo.x, hi.y - lo.y, hi.z - lo.z)
        # Distance so the part fills about two thirds of the frame at an 85mm lens.
        d = size * 3.2 * dist
        e = math.radians(el)
        look = Vector((c.x, c.y, lo.z + (hi.z - lo.z) * lookh))
        cam.location = look + Vector((0, -math.cos(e) * d, math.sin(e) * d))
        cam.rotation_euler = (look - cam.location).to_track_quat('-Z', 'Y').to_euler()
        cam_d.dof.focus_distance = d
        scene.render.filepath = os.path.join(OUT, f'{name}-{view}.webp')
        t = time.time()
        bpy.ops.render.render(write_still=True)
        print('RENDERED', name, view, round(time.time() - t, 1), 's', flush=True)
        made.append(view)

names = sorted(f[:-4] for f in os.listdir(GLB) if f.endswith('.glb'))
for n in names:
    if ONLY and n not in ONLY: continue
    render_model(n)
print('DONE', flush=True)
