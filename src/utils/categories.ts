import type { Category } from "../db/schema";
import type { categoryFormat } from "./definitions";

export function saveChildren(list: Array<Category>, parentId: number): Array<categoryFormat> {
  const res = list.filter((el) => el.parentCategoryId == parentId && el.enabled);
  if (res.length == 0) return []
  const resFormatted: Array<categoryFormat> = [];
  res.forEach((categoryEl) => {
    const obj: categoryFormat = {
      category_id: categoryEl.categoryId,
      name: categoryEl.name,
      children: saveChildren(list, categoryEl.categoryId),
    };
    resFormatted.push(obj);
  });
  return resFormatted;
}
