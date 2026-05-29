import { Request, Response } from 'express';
import NotificationSettings from '../models/NotificationSettings.js';

export type NotificationPreferenceKey = 'newFaq' | 'pendingApproval' | 'newUser' | 'systemAlerts' | 'weeklyReport';
export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

// GET /api/notifications/settings — get current user's notification preferences
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    let settings = await NotificationSettings.findOne({ user: userId });

    if (!settings) {
      // Create defaults on first access
      settings = await NotificationSettings.create({ user: userId });
    }

    res.json({
      newFaq: settings.newFaq,
      pendingApproval: settings.pendingApproval,
      newUser: settings.newUser,
      systemAlerts: settings.systemAlerts,
      weeklyReport: settings.weeklyReport,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// PATCH /api/notifications/settings — update one or more notification preferences
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const updates = req.body as Partial<NotificationPreferences>;

    const allowed: NotificationPreferenceKey[] = ['newFaq', 'pendingApproval', 'newUser', 'systemAlerts', 'weeklyReport'];
    const sanitized: Partial<NotificationPreferences> = {};

    for (const key of allowed) {
      if (key in updates) {
        (sanitized as any)[key] = updates[key];
      }
    }

    const settings = await NotificationSettings.findOneAndUpdate(
      { user: userId },
      { $set: sanitized },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      newFaq: settings.newFaq,
      pendingApproval: settings.pendingApproval,
      newUser: settings.newUser,
      systemAlerts: settings.systemAlerts,
      weeklyReport: settings.weeklyReport,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};