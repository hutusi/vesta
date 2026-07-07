import { pangu } from './pangu.ts';

/**
 * remark plugin that applies 盘古之白 spacing to all markdown text nodes.
 *
 * It only touches `text` nodes, so inline code and fenced code blocks (which
 * are distinct node types) are left untouched. Text split across formatting
 * boundaries (e.g. bold mid-word) won't be spaced across the seam — an
 * accepted limitation.
 */
interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
}

function walk(node: MdNode): void {
  if (node.type === 'text' && typeof node.value === 'string') {
    node.value = pangu(node.value);
    return;
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child);
  }
}

export default function remarkPangu() {
  return (tree: MdNode): void => walk(tree);
}
