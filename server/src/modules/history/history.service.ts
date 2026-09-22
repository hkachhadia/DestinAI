import { Types } from 'mongoose';
import { Analysis, IAnalysis } from '../analysis/analysis.model';

export interface HistoryPage {
  entries: IAnalysis[];
  total: number;
  page: number;
  limit: number;
}

export async function listHistory(userId: string, page = 1, limit = 20): Promise<HistoryPage> {
  const filter = { userId: new Types.ObjectId(userId) };
  const [entries, total] = await Promise.all([
    Analysis.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Analysis.countDocuments(filter),
  ]);

  return { entries, total, page, limit };
}
