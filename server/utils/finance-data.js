import FinanceData from '../models/FinanceData.js'

export async function ensureFinanceData(userId) {
  try {
    return await FinanceData.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
  } catch (error) {
    if (error.code !== 11000) throw error
    const existing = await FinanceData.findOne({ userId })
    if (!existing) throw error
    return existing
  }
}
