<template>
	<svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="block h-full w-full overflow-visible" aria-hidden="true">
		<defs>
			<linearGradient :id="id" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="currentColor" stop-opacity="0.25" />
				<stop offset="100%" stop-color="currentColor" stop-opacity="0" />
			</linearGradient>
		</defs>
		<g v-if="grid" stroke="rgb(255 255 255 / 0.06)" stroke-width="1" vector-effect="non-scaling-stroke">
			<line v-for="i in 4" :key="i" x1="0" :x2="W" :y1="(H / 5) * i" :y2="(H / 5) * i" vector-effect="non-scaling-stroke" />
		</g>
		<g v-if="bars" fill="currentColor">
			<rect v-for="(b, i) in barRects" :key="i" :x="b.x" :y="b.y" :width="b.w" :height="b.h" opacity="0.85" />
		</g>
		<template v-else>
		<path v-if="area" :d="area" :fill="`url(#${id})`" />
		<path v-if="line" :d="line" fill="none" stroke="currentColor" :stroke-width="width" vector-effect="non-scaling-stroke" stroke-linejoin="round" pathLength="1" :class="{ draw: animate }" />
		</template>
	</svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ points: number[]; grid?: boolean; animate?: boolean; width?: number; bars?: boolean }>(), { grid: false, animate: false, width: 1.5, bars: false });
const W = 300;
const H = 80;
const id = `spark-${useId()}`;

const coords = computed(() => {
	const p = props.points.length === 1 ? [props.points[0]!, props.points[0]!] : props.points;
	if (!p.length) return [];
	const min = Math.min(...p);
	const span = Math.max(...p) - min || 1;
	return p.map((v, i) => [(i / (p.length - 1)) * W, H - 4 - ((v - min) / span) * (H - 8)] as const);
});
const line = computed(() => coords.value.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(""));
const area = computed(() => (line.value ? `${line.value}L${W},${H}L0,${H}Z` : ""));
const barRects = computed(() => {
	const p = props.points;
	const max = Math.max(...p, 0) || 1;
	const step = W / Math.max(p.length, 1);
	return p.map((v, i) => ({ x: i * step + step * 0.15, w: step * 0.7, h: Math.max(1, (v / max) * (H - 4)), y: H - Math.max(1, (v / max) * (H - 4)) }));
});
</script>
