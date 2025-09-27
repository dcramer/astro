import type { NinaSequenceItem } from "@nina/advanced";

export function findSequenceItemByPath(
  items: ReadonlyArray<NinaSequenceItem> | undefined,
  path: ReadonlyArray<string> | null | undefined,
): NinaSequenceItem | null {
  if (!items || !path || !path.length) {
    return null;
  }

  let currentItems: ReadonlyArray<NinaSequenceItem> | undefined = items;
  let currentItem: NinaSequenceItem | null = null;

  for (const segment of path) {
    if (!currentItems) {
      return null;
    }
    currentItem = currentItems.find((item) => item.name === segment) ?? null;
    if (!currentItem) {
      return null;
    }
    currentItems = currentItem.items;
  }

  return currentItem;
}