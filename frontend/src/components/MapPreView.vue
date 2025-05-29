<template>
  <div>
    <v-stage v-if="map" :config="{ width: map.width, height: map.height }"
      style="border:2px dashed #CCC;background: #FFF">
      <v-layer id="baseLayer">
        <v-circle v-for="circle in circles" :key="circle.id" :config="circle" />
        <v-rect v-for="rect in rectangles" :key="rect.id" :config="rect" />
        <v-image v-if="startPoint && startPoint.image" :config="startPoint" />
        <v-image v-if="endPoint && endPoint.image" :config="endPoint" />
      </v-layer>
    </v-stage>
    <div v-else>暂无地图数据</div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import type { GetMapListDto } from '@/http/map';
  import type { ObstaclesDto } from "@/@types/dto";
  import startIcon from "@/assets/images/startpoint.png";
  import endIcon from "@/assets/images/endpoint.png";
  const props = defineProps<{ map: GetMapListDto }>();
  const circles = computed(() => props.map?.obstacles?.filter((o: ObstaclesDto) => o.type === 'circle') || []);
  const rectangles = computed(() => props.map?.obstacles?.filter((o: ObstaclesDto) => o.type === 'rectangle') || []);

  const startImg = ref<HTMLImageElement | null>(null);
  const endImg = ref<HTMLImageElement | null>(null);

  const startPoint = computed(() => {
    if (!props.map) return null;
    const pt = props.map.startPoint || { x: -1, y: -1 };
    return {
      x: pt.x,
      y: pt.y,
      width: 30,
      height: 30,
      image: startImg.value,
      offset: {
        x: 15,
        y: 30,
      },
    };
  });
  const endPoint = computed(() => {
    if (!props.map) return null;
    const pt = props.map.endPoint || { x: -1, y: -1 };
    return {
      x: pt.x,
      y: pt.y,
      width: 30,
      height: 30,
      image: endImg.value,
      offset: {
        x: 15,
        y: 30,
      },
    };
  });

  onMounted(async () => {
    const img1 = new window.Image();
    img1.src = startIcon;
    img1.onload = () => { startImg.value = img1; };
    const img2 = new window.Image();
    img2.src = endIcon;
    img2.onload = () => { endImg.value = img2; };
  });
</script>

<style scoped></style>
