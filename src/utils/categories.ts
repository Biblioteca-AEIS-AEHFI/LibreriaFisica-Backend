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
      icon: categoryEl.icon,
      children: saveChildren(list, categoryEl.categoryId),
    };
    resFormatted.push(obj);
  });
  return resFormatted;
}


export function trackCategories(list: Array<any>) {
  const categories: any = {}
  list.forEach(categoryEl => {
    if (categoryEl.categories?.parentCategoryId == null && !categories[categoryEl.categories?.categoryId])
      categories[categoryEl.categories?.categoryId] = { name: categoryEl.categories?.name, children: [] } 

    if (categoryEl.categories?.parentCategoryId != null) {
      categories[categoryEl.categories?.parentCategoryId].children.push(categoryEl.categories?.name)
    }
  })
  return categories
}


export function getLeastCategory(categories: any, categoryId: number) {
  const categoryObj = categories[categoryId]
  if (!categoryObj) return null
  return (categoryObj.children.length == 0 ? categoryObj.name : categoryObj.children.at(-1))
}