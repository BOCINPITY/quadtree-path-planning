
import type { QuadTreeNode } from './quadTree';



export function countNodes(node: QuadTreeNode): number {
  if (!node) return 0;
  if (node.isLeaf) return 1;
  return 1 + (node.children?.reduce((sum, child) => sum + countNodes(child), 0) || 0);
}

export function calculateTreeDepth(node: QuadTreeNode): number {
  if (!node || node.isLeaf) return 1;
  return 1 + Math.max(...(node.children?.map(calculateTreeDepth) || [0]));
}

export function countLeafNodes(node: QuadTreeNode): number {
  if (!node) return 0;
  if (node.isLeaf) return 1;
  return node.children?.reduce((sum, child) => sum + countLeafNodes(child), 0) || 0;
}

export function calculateAverageObstacleCoverage(node: QuadTreeNode): number {
  const leafNodes = getAllLeafNodes(node);
  const totalCoverage = leafNodes.reduce((sum, leaf) => sum + leaf.obstacleCount, 0);
  return totalCoverage / leafNodes.length;
}

export function calculateMaxObstacleCoverage(node: QuadTreeNode): number {
  const leafNodes = getAllLeafNodes(node);
  return Math.max(...leafNodes.map(leaf => leaf.obstacleCount));
}

export function getAllLeafNodes(node: QuadTreeNode): QuadTreeNode[] {
  if (!node) return [];
  if (node.isLeaf) return [node];
  return node.children?.flatMap(getAllLeafNodes) || [];
}

