using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Domain.Entities;
using CrmStella.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmStella.Infrastructure.Repositories;

public class NotificationRepository(AppDbContext context) : INotificationRepository
{
    public async Task<List<Notification>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.Notifications
            .AsNoTracking()
            .Include(n => n.User)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Notification?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.Notifications
            .AsNoTracking()
            .Include(n => n.User)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task<List<Notification>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Notification>> GetUnreadByUserIdAsync(int userId,
        CancellationToken cancellationToken = default)
    {
        return await context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead, cancellationToken);
    }

    public async Task CreateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        await context.Notifications.AddAsync(notification, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        context.Notifications.Update(notification);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var notification = await context.Notifications.FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
        if (notification != null)
        {
            context.Notifications.Remove(notification);
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task MarkAsReadAsync(int id, CancellationToken cancellationToken = default)
    {
        var notification = await context.Notifications.FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
        if (notification != null && !notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default)
    {
        var notifications = await context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}