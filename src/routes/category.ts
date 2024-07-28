import { Router, type Request, type Response } from 'express'
import { type Category, type NewCategory, categories, CategorySchema, NewCategorySchema } from '../db/schema'
import { db } from '../db/db'
import { eq } from 'drizzle-orm'

export const categoryRouter: Router = Router()


// get categories
categoryRouter.get('/', async (req: Request, res: Response) => {
  try {
    const categoriesList: Array<Category> = await db.select().from(categories);
    return res.status(200).json({
      message: 'categories handled successfully',
      data: categoriesList
    })
  } catch(err) {
    return res.status(500).json({ message: 'error while handling categories' })
  }
})

// get category by id
categoryRouter.get('/:id', async (req: Request, res: Response) => {
  const numberRegex = /^\d+$/;
  const id: string = req.params.id
  if (!numberRegex.test(id)) return res.status(404).json({ message: 'error while handling categories by id' })
  try {
    const category: Category = (await db.select().from(categories).where(eq(categories.categoryId, Number(id))))[0];
    if (!category) return res.status(404).json({ message: 'category not found', data: [] }) 
    
    return res.status(200).json({
      message: 'category found successfully',
      data: category
    })
  } catch(err) {
      return res.status(500).json({ message: 'error while handling categories with id' })
  }
})

// get category by name
categoryRouter.get('/especialidad/:name', async (req: Request, res: Response) => {
  const categoryName: string = req.params.name
  try {
    const category: Category = (await db.select().from(categories).where(eq(categories.name, categoryName)))[0];
    if (!category) return res.status(404).json({ message: 'category not found', data: [] })

    return res.status(200).json({
      message: 'category found successfully',
      data: category
    })
  } catch(err) {
      console.log(err)
      return res.status(500).json({ message: 'error while handling categories' })
  }
})

// create a category

categoryRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const validCategory: boolean = (NewCategorySchema.safeParse(req.body)).success 
    if (!validCategory) return res.status(400).json({ message: 'Invalid category parameters', data: [] })

    const returningId: number = (await db.insert(categories).values(req.body).$returningId())[0].categoryId
    const categoryCreated = await db.select().from(categories).where(eq(categories.categoryId, returningId))

    return res.status(200).json({
      message: 'category created successfully',
      data: categoryCreated
    })
  } catch(err) {
    console.log(err)
    return res.status(500).json({ message: 'error while handling category' })
  }
})

// delete a category by id
categoryRouter.delete('/:id', async (req: Request, res: Response) => {
  const numberRegex = /^\d+$/;
  const id: string = req.params.id
  if (!numberRegex.test(id)) return res.status(400).json({ message: 'invalid parameters' })

  try {
    const categoryToDelete: Category = (await db.select().from(categories).where(eq(categories.categoryId, Number(id))))[0]
    if (!categoryToDelete) return res.status(400).json({ message: 'invalid parameters' })

    await db.delete(categories).where(eq(categories.categoryId, Number(id)))

    return res.status(200).json({
      message: 'category deleted successfully',
      data: categoryToDelete
    })
  } catch(err) {
    return res.status(500).json({ message: 'error while trying to delete category' })
  }
})

// delete category by name
categoryRouter.delete('/categoria/:name', async (req: Request, res: Response) => {
  const name: string = req.params.name
  try {
    const categoryToDelete: Category = (await db.select().from(categories).where(eq(categories.name, name)))[0]
    if (!categoryToDelete) return res.status(400).json({ message: 'invalid paramaters' })

    await db.delete(categories).where(eq(categories.name, name))
    return res.status(200).json({ message: 'category deleted successfully' })
  } catch(err) {
    return res.status(500).json({ message: 'error while deleting category' })
  }
})