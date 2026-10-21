<template>
	<svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="block h-full w-full" aria-hidden="true">
		<defs>
			<linearGradient :id="id" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="currentColor" stop-opacity="0.22" />
				<stop offset="100%" stop-color="currentColor" stop-opacity="0" />
			</linearGradient>
		</defs>
		<path v-if="area" :d="area" :fill="`url(#${id})`" />
		<path v-if="line" :d="line" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
	</svg>
</template>

<script setup lang="ts">
const props = defineProps<{ points: number[] }>();
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
