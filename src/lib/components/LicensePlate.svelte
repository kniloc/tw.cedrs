<script>
    let {src, text, color = '#000000'} = $props();

    let canvasEl;
    const MARKER_RGB = [255, 0, 255];
    const TOLERANCE = 15;

    function pixelIndex(x, y, width) {
        return (y * width + x) * 4;
    }

    function isMarker(pixels, i) {
        return Math.abs(pixels[i] - MARKER_RGB[0]) <= TOLERANCE
            && Math.abs(pixels[i + 1] - MARKER_RGB[1]) <= TOLERANCE
            && Math.abs(pixels[i + 2] - MARKER_RGB[2]) <= TOLERANCE
            && pixels[i + 3] > 200;
    }

    function getPixels(ctx, width, height) {
        return ctx.getImageData(0, 0, width, height);
    }

    function findMarkerRegions(pixels, width, height) {
        const markerCols = new Set();
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (isMarker(pixels, pixelIndex(x, y, width))) {
                    markerCols.add(x);
                }
            }
        }
        if (markerCols.size === 0) return [];

        const cols = [...markerCols].sort((a, b) => a - b);
        const groups = [[cols[0]]];
        for (let i = 1; i < cols.length; i++) {
            if (cols[i] - cols[i - 1] > 1) groups.push([]);
            groups[groups.length - 1].push(cols[i]);
        }

        return groups.map(group => {
            const minX = group[0], maxX = group[group.length - 1];
            let minY = height, maxY = 0;

            for (let y = 0; y < height; y++) {
                for (const x of group) {
                    if (isMarker(pixels, pixelIndex(x, y, width))) {
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                        break;
                    }
                }
            }

            const midX = (minX + maxX) >> 1, midY = (minY + maxY) >> 1;
            const inset = (startVal, endVal, step, fixedAxis, vertical) => {
                let count = 0;
                for (let v = startVal; step > 0 ? v <= endVal : v >= endVal; v += step) {
                    const i = vertical ? pixelIndex(fixedAxis, v, width) : pixelIndex(v, fixedAxis, width);
                    if (!isMarker(pixels, i)) break;
                    count++;
                }
                return count;
            };

            const left = inset(minX, maxX, 1, midY, false);
            const right = inset(maxX, minX, -1, midY, false);
            const top = inset(minY, maxY, 1, midX, true);
            const bottom = inset(maxY, minY, -1, midX, true);

            return {
                x: minX + left,
                y: minY + top,
                w: maxX + 1 - right - (minX + left),
                h: maxY + 1 - bottom - (minY + top)
            };
        });
    }

    function clearMarkers(imageData, width, height) {
        const pixels = imageData.data;
        const markers = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = pixelIndex(x, y, width);
                if (isMarker(pixels, i)) markers.push({x, y, i});
            }
        }

        for (const {x, y, i} of markers) {
            for (let r = 1; r <= 10; r++) {
                let found = false;
                for (let dy = -r; dy <= r && !found; dy++) {
                    for (let dx = -r; dx <= r && !found; dx++) {
                        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                        const nx = x + dx, ny = y + dy;
                        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                        const ni = pixelIndex(nx, ny, width);
                        if (!isMarker(pixels, ni)) {
                            pixels.copyWithin(i, ni, ni + 4);
                            found = true;
                        }
                    }
                }
                if (found) break;
            }
        }
    }

    function splitTextToRegions(text, regionCount) {
        const segments = text.split(' ');
        if (segments.length <= regionCount) return segments;
        return [
            ...segments.slice(0, regionCount - 1),
            segments.slice(regionCount - 1).join(' ')
        ];
    }

    function renderTextToRegion(ctx, segment, region, color) {
        const fontSize = Math.max(region.h * 2, 200);
        const font = `${fontSize}px 'Dealerplate', sans-serif`;

        const tmp = new OffscreenCanvas(1, 1);
        const tmpCtx = tmp.getContext('2d');
        tmpCtx.font = font;
        tmp.width = Math.ceil(tmpCtx.measureText(segment).width);
        tmp.height = fontSize;
        tmpCtx.font = font;
        tmpCtx.fillStyle = color;
        tmpCtx.textBaseline = 'top';
        tmpCtx.fillText(segment, 0, 0);

        ctx.drawImage(tmp, region.x, region.y, region.w, region.h);
    }

    function bakeText(loadedImg) {
        const ctx = canvasEl.getContext('2d', {willReadFrequently: true});
        canvasEl.width = loadedImg.naturalWidth;
        canvasEl.height = loadedImg.naturalHeight;
        ctx.drawImage(loadedImg, 0, 0);

        const {width, height} = canvasEl;
        const imageData = getPixels(ctx, width, height);
        const regions = findMarkerRegions(imageData.data, width, height);
        if (regions.length === 0) return;

        clearMarkers(imageData, width, height);
        ctx.putImageData(imageData, 0, 0);

        const segments = splitTextToRegions(text, regions.length);
        regions.forEach((region, i) => {
            renderTextToRegion(ctx, segments[i] ?? segments[segments.length - 1], region, color);
        });
    }

    $effect(() => {
        if (!src || !canvasEl) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => bakeText(img);
        img.src = src;
    });
</script>

<canvas bind:this={canvasEl} style:--border-color={color}></canvas>

<style>
    canvas {
        width: 360px;
        aspect-ratio: 2 / 1;
        border: 2px solid var(--border-color);
    }

    @media (max-width: 640px) {
        canvas {
            width: 100%;
        }
    }
</style>
