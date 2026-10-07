import { z } from 'zod'

const id = z.union([z.string().min(1).max(100), z.number().int().positive()]).transform(String)
const amount = z.coerce.number().finite().min(0).max(1_000_000_000_000)
const shortText = (max) => z.string().trim().min(1).max(max)
const date = z.string().trim().min(1).max(40)

export const registerSchema = z.object({
  fullName: shortText(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
}).strict()

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
}).strict()

export const profileSchema = z.object({
  fullName: shortText(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(''),
}).strict()

export const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
}).strict()

export const preferencesSchema = z.object({
  notifications: z.object({
    enabled: z.boolean(),
    email: z.boolean(),
    push: z.boolean(),
    budgetAlerts: z.boolean(),
    expenseAlerts: z.boolean(),
    incomeAlerts: z.boolean(),
    savingsAlerts: z.boolean(),
  }).strict().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'RWF']).optional(),
  language: z.enum(['English', 'French', 'Spanish']).optional(),
  dateFormat: z.enum(['MMM d, yyyy', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one preference is required.')

export const notificationSchema = z.object({
  id: id.optional(),
  type: shortText(40),
  title: shortText(160),
  message: z.string().trim().max(500).default(''),
  createdAt: z.coerce.number().int().nonnegative().default(Date.now()),
  read: z.boolean().default(false),
}).strict()

const incomeSchema = z.object({
  id: id.optional(), date, source: shortText(120), amount, note: z.string().max(500).default(''),
}).strict()
const expenseSchema = z.object({
  id: id.optional(), date, description: shortText(160), category: shortText(100), amount,
}).strict()
const categorySchema = z.object({
  id: id.optional(), name: shortText(100), icon: z.string().max(40).default('others'), count: z.coerce.number().nonnegative().default(0),
}).strict()
const budgetSchema = z.object({
  id: id.optional(), category: shortText(100), budget: amount, spent: amount.default(0), month: z.string().regex(/^\d{4}-\d{2}$/).or(z.literal('')).default(''),
}).strict()
const savingsSchema = z.object({
  id: id.optional(), name: shortText(120), current: amount, target: amount, date, icon: z.string().max(40).default('laptop'),
}).strict()
const paymentSchema = z.object({
  id: id.optional(), date, description: shortText(160), amount, method: z.string().max(80).default(''), status: z.string().max(40).default('completed'),
}).strict()

export const resourceSchemas = {
  income: incomeSchema,
  expenses: expenseSchema,
  categories: categorySchema,
  budgets: budgetSchema,
  savings: savingsSchema,
  payments: paymentSchema,
}

export const replaceDataSchema = z.object({
  income: z.array(incomeSchema).max(10000).optional(),
  expenses: z.array(expenseSchema).max(10000).optional(),
  categories: z.array(categorySchema).max(500).optional(),
  budgets: z.array(budgetSchema).max(2000).optional(),
  savings: z.array(savingsSchema).max(2000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one data collection is required.')

export function validate(schema, value) {
  const result = schema.safeParse(value)
  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => issue.message).join(' '))
    error.statusCode = 400
    throw error
  }
  return result.data
}
