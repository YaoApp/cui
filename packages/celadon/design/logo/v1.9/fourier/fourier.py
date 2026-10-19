#!/usr/bin/env python3
"""
Fourier ghost — draw a silhouette with epicycles.

Usage:
  python3 fourier.py --image ../../brand/ghost-mono-sil-85857a.png --n 24 --out out/ghost --svg --png --mp4

Outputs:
  <out>-N24.svg   vector path of the reconstructed body + eye holes
  <out>-N24.png   original vs reconstruction, side by side
  <out>-N24.mp4   1080x1080 animation of the 2N+1 circles

The input must have transparency: alpha is used as the silhouette.
"""
import argparse
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw


def load_shape(path):
    img = Image.open(path).convert("RGBA")
    alpha = np.array(img)[:, :, 3]
    mask = (alpha > 127).astype(np.uint8)
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    if hierarchy is None:
        raise SystemExit("No contour found — does the PNG have transparency?")
    hierarchy = hierarchy[0]
    # largest outer contour
    outer_idx = max((i for i in range(len(contours)) if hierarchy[i][3] == -1),
                    key=lambda i: cv2.contourArea(contours[i]))
    outer = contours[outer_idx][:, 0, :].astype(float)
    holes = []
    child = hierarchy[outer_idx][2]
    while child != -1:
        if cv2.contourArea(contours[child]) > 8:
            holes.append(contours[child][:, 0, :].astype(float))
        child = hierarchy[child][0]
    return mask, outer, holes


def resample(points, n=4096):
    d = np.sqrt(((np.roll(points, -1, axis=0) - points) ** 2).sum(axis=1))
    s = np.concatenate([[0], np.cumsum(d)])
    length = s[-1]
    u = np.linspace(0, length, n, endpoint=False)
    x = np.interp(u, s, np.r_[points[:, 0], points[0, 0]])
    y = np.interp(u, s, np.r_[points[:, 1], points[0, 1]])
    return np.stack([x, y], axis=1)


def coefficients(points):
    z = points[:, 0] + 1j * points[:, 1]
    return np.fft.fft(z) / len(z)


def reconstruct(coeffs, n, samples=720):
    total = len(coeffs)
    freq = np.fft.fftfreq(total)
    keep = np.abs(freq) <= n / total
    z = np.zeros(samples, dtype=complex)
    t = np.linspace(0, 1, samples, endpoint=False)
    for k in np.flatnonzero(keep):
        z += coeffs[k] * np.exp(2j * np.pi * freq[k] * total * t)
    return np.stack([z.real, z.imag], axis=1)


def fmt_path(points):
    cmds = [f"M {points[0, 0]:.2f} {points[0, 1]:.2f}"]
    cmds += [f"L {p[0]:.2f} {p[1]:.2f}" for p in points[1:]]
    cmds.append("Z")
    return " ".join(cmds)


def save_svg(path, body, holes, size=1024, fill="#2F3A45"):
    d = fmt_path(body)
    for h in holes:
        d += " " + fmt_path(h)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <path d="{d}" fill="{fill}" fill-rule="evenodd"/>
</svg>
'''
    open(path, "w").write(svg)


def save_png(path, mask, body, holes, n, size=1024):
    canvas = Image.new("RGB", (size * 2, size), (244, 241, 234))
    d = ImageDraw.Draw(canvas)
    # original
    orig = Image.fromarray((mask * 255).astype(np.uint8)).resize((size, size), Image.NEAREST)
    orig = Image.merge("RGBA", (orig, orig, orig, orig))
    canvas.paste(Image.new("RGB", (size, size), (47, 58, 69)), (0, 0))
    canvas.paste(orig, (0, 0), orig)
    # reconstruction
    canvas.paste(Image.new("RGB", (size, size), (244, 241, 234)), (size, 0))
    poly = [(float(x), float(y)) for x, y in body]
    d.polygon(poly, fill=(47, 58, 69))
    for h in holes:
        d.polygon([(float(x), float(y)) for x, y in h], fill=(244, 241, 234))
    d.text((20, 20), f"N={n}  {2*n+1} circles", fill=(244, 241, 234))
    canvas.save(path)


def animate(coeffs, n, path, size=1080, fps=30, seconds=8):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.animation import FFMpegWriter
    from matplotlib.patches import Circle

    total = len(coeffs)
    freq = np.fft.fftfreq(total)
    order = np.argsort(-np.abs(coeffs))
    keep = [k for k in order if abs(freq[k]) <= n / total]
    keep = sorted(keep, key=lambda k: abs(freq[k]))

    fig = plt.figure(figsize=(size / 100, size / 100), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1024)
    ax.set_ylim(1024, 0)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.patch.set_facecolor("#F4F1EA")
    circles = [Circle((0, 0), 0, fill=False, lw=0.8, ec=(0.18, 0.18, 0.14, 0.28)) for _ in keep]
    for c in circles:
        ax.add_patch(c)
    line, = ax.plot([], [], color="#2F3A45", lw=2.2)
    dot, = ax.plot([], [], "o", color="#19F0D9", ms=3)

    frames = max(2, int(fps * seconds))
    writer = FFMpegWriter(fps=fps, bitrate=6000)
    writer.setup(fig, path, dpi=100)

    xs, ys = [], []
    for f in range(frames):
        t = f / frames
        z = 0 + 0j
        for c, k in zip(circles, keep):
            c.center = (z.real, z.imag)
            c.set_radius(abs(coeffs[k]))
            z += coeffs[k] * np.exp(2j * np.pi * freq[k] * total * t)
        xs.append(z.real)
        ys.append(z.imag)
        line.set_data(xs, ys)
        dot.set_data([z.real], [z.imag])
        writer.grab_frame()
    writer.finish()
    plt.close(fig)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--image", required=True)
    p.add_argument("--n", type=int, default=24)
    p.add_argument("--out", default="out/ghost")
    p.add_argument("--svg", action="store_true")
    p.add_argument("--png", action="store_true")
    p.add_argument("--mp4", action="store_true")
    p.add_argument("--color", default="#2F3A45")
    p.add_argument("--size", type=int, default=1024)
    args = p.parse_args()

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    mask, outer, holes = load_shape(args.image)
    outer_rs = resample(outer, 4096)
    coeffs = coefficients(outer_rs)
    body = reconstruct(coeffs, args.n, samples=720)

    # scale reconstructed points to the same canvas
    if args.svg:
        save_svg(f"{args.out}-N{args.n}.svg", body, holes, args.size, args.color)
    if args.png:
        save_png(f"{args.out}-N{args.n}.png", mask, body, holes, args.n, args.size)
    if args.mp4:
        animate(coeffs, args.n, f"{args.out}-N{args.n}.mp4", size=args.size)
    print(f"N={args.n}  circles={2*args.n+1}  body points={len(body)}")


if __name__ == "__main__":
    main()
