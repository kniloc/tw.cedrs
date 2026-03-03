<script>
    let {src, text, color = '#000000'} = $props();

    let canvasEl;
    let worker;

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
        const imageData = ctx.getImageData(0, 0, width, height);

        worker.onmessage = ({data: {regions, imageData: processed}}) => {
            if (regions.length === 0) return;
            ctx.putImageData(processed, 0, 0);

            const segments = splitTextToRegions(text, regions.length);
            regions.forEach((region, i) => {
                renderTextToRegion(ctx, segments[i] ?? segments[segments.length - 1], region, color);
            });
        };

        worker.postMessage({imageData, width, height}, [imageData.data.buffer]);
    }

    $effect(() => {
        if (!src || !canvasEl) return;
        if (!worker) {
            worker = new Worker(
                new URL('$lib/workers/plateProcessor.js', import.meta.url),
                {type: 'module'}
            );
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
            await document.fonts.ready;
            bakeText(img);
        };
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
