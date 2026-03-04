<template>
  <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', colorClass]">
    {{ label }} {{ score }}%
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: 'VERIFIED' | 'LIKELY' | 'UNVERIFIED' | 'RUMOR'
  score: number
}>()

const colorClass = computed(() => ({
  VERIFIED: 'bg-green-900/60 text-war-green border border-war-green/40',
  LIKELY: 'bg-yellow-900/60 text-war-yellow border border-war-yellow/40',
  UNVERIFIED: 'bg-orange-900/60 text-war-orange border border-war-orange/40',
  RUMOR: 'bg-red-900/60 text-war-red border border-war-red/40',
}[props.label]))
</script>
