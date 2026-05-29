import mongoose, { Types } from 'mongoose';
import { Request, Response } from 'express';
import Notification from '../models/Notification.js';

export interface CreateNotificationParams {
  recipient: Types.ObjectId;
  type: 'post_resolved' | 'comment_replied' | 'faq_match_found' | 'mention';
  title: string;
  message: string;
  link?: string;
}

// Internal helper — creates a notification. Does NOT send a response.
// Used by other controllers (e.g. communityController) to trigger notifications.
export const createNotification = async (params: CreateNotificationParams): Promise<void> => {
  try {
    await Notification.create({
      recipient: params.recipient,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? '#',
    });
  } catch {
    // Non-critical — swallow errors so notification failures don't break the parent operation
  }
};

// GET /api/notifications — Get all notifications for the authenticated user
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find({ recipient: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// GET /api/notifications/unread-count — Get unread notification count
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user!._id,
      read: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// PATCH /api/notifications/:id/read — Mark a single notification as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user!._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }

    res.json({ notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// PATCH /api/notifications/read-all — Mark all notifications as read for the user
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      { recipient: req.user!._id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// DELETE /api/notifications/:id — Delete a notification
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user!._id,
    });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }

    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};