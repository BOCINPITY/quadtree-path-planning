import type { Obstacles } from "@/@types/dto";
import { generateId } from "@/utils/index";

/**
 * @description 删除障碍物
 * @param obstacles 障碍物数组的引用
 * @param element 要删除的障碍物
 */
export const deleteObstacle = (obstacles: Obstacles[], element: Obstacles | null) => {
  if (element) {
    const index = obstacles.findIndex((item) => item.id === element.id);
    if (index !== -1) {
      obstacles.splice(index, 1);
    }
  }
};

/**
 * @description 复制障碍物
 * @param obstacles 障碍物数组的引用
 * @param element 要复制的障碍物
 */
export const copyObstacle = (obstacles: Obstacles[], element: Obstacles | null) => {
  if (element) {
    const newElement = {
      ...element,
      id: generateId(),
      x: element.x + 10, // 稍微偏移避免重叠
      y: element.y + 10,
    };
    obstacles.push(newElement);
  }
};

/**
 * @description 添加障碍物
 * @param obstacles 障碍物数组的引用
 * @param type 障碍物类型
 */
export const addObstacle = (obstacles: Obstacles[], type: "circle" | "rectangle") => {
  const commonProps = {
    fill: "#000",
    stroke: "#000",
    strokeWidth: 0,
    id: generateId(),
    draggable: true,
    isDragging: false,
    isActive: false,
  };

  if (type === "circle") {
    obstacles.push({
      ...commonProps,
      type,
      radius: 50,
      x: 100,
      y: 100,
    });
  } else if (type === "rectangle") {
    obstacles.push({
      ...commonProps,
      type,
      width: 100,
      height: 100,
      x: 200,
      y: 150,
    });
  }
};
