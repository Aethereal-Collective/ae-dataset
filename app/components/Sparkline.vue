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
		<path v-if="area" :d="area" :fill="`url(#${id})`" />
		<path v-if="line" :d="line" fill="none" stroke="currentColor" :stroke-width="width" vector-effect="non-scaling-stroke" stroke-linejoin="round" pathLength="1" :class="{ draw: animate }" />
	</svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ points: number[]; grid?: boolean; animate?: boolean; width?: number }>(), { grid: false, animate: false, width: 1.5 });
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
</script>
