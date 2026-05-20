using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Notification.Request;
using EduCrm.Application.DTOs.Notification.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class NotificationService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<NotificationService> logger,
    IEmailService emailService) : INotificationService
{
    private const string NotificationCachePrefix = "notifications:";
    private const string NotificationListCacheKey = "notifications:list";

    public async Task<Result<List<NotificationResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var cached = await cache.GetAsync<List<NotificationResponse>>(NotificationListCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Notifications list served from cache");
            return Result<List<NotificationResponse>>.Ok(cached);
        }

        var notifications = await unitOfWork.Notifications.GetAllAsync(cancellationToken);
        var result = notifications.Select(MapToResponse).ToList();

        await cache.SetAsync(NotificationListCacheKey, result, TimeSpan.FromMinutes(5));
        return Result<List<NotificationResponse>>.Ok(result);
    }

    public async Task<Result<NotificationResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{NotificationCachePrefix}{id}";
        var cached = await cache.GetAsync<NotificationResponse>(cacheKey);
        if (cached is not null)
        {
            return Result<NotificationResponse>.Ok(cached);
        }

        var notification = await unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification is null)
        {
            logger.LogWarning("Notification not found: {NotificationId}", id);
            return Result<NotificationResponse>.Fail("Notification not found");
        }

        var response = MapToResponse(notification);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));
        return Result<NotificationResponse>.Ok(response);
    }

    public async Task<Result<List<NotificationResponse>>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{NotificationCachePrefix}user:{userId}";
        var cached = await cache.GetAsync<List<NotificationResponse>>(cacheKey);
        if (cached is not null)
        {
            return Result<List<NotificationResponse>>.Ok(cached);
        }

        var user = await unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result<List<NotificationResponse>>.Fail("User not found", ErrorType.BadRequest);
        }

        var notifications = await unitOfWork.Notifications.GetByUserIdAsync(userId, cancellationToken);
        var result = notifications.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5));
        return Result<List<NotificationResponse>>.Ok(result);
    }

    public async Task<Result<List<NotificationResponse>>> GetUnreadByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        var notifications = await unitOfWork.Notifications.GetUnreadByUserIdAsync(userId, cancellationToken);
        var result = notifications.Select(MapToResponse).ToList();
        return Result<List<NotificationResponse>>.Ok(result);
    }

    public async Task<Result<int>> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default)
    {
        var count = await unitOfWork.Notifications.GetUnreadCountAsync(userId, cancellationToken);
        return Result<int>.Ok(count);
    }

    public async Task<Result<NotificationResponse>> CreateAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default)
    {
        var user = await unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null)
        {
            logger.LogWarning("Create failed - user not found: {UserId}", request.UserId);
            return Result<NotificationResponse>.Fail("User not found", ErrorType.BadRequest);
        }

        var notification = new Notification
        {
            UserId = request.UserId,
            Title = request.Title.Trim(),
            Message = request.Message.Trim(),
            Type = request.Type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await unitOfWork.Notifications.CreateAsync(notification, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        try
        {
            var subject = notification.Title;
            var emailBody = $"""
                <h2 style="margin: 0 0 12px; font-size: 20px; color: #111;">{notification.Title}</h2>
                <p style="margin: 0 0 24px; font-size: 15px; color: #444; line-height: 1.6;">{notification.Message}</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #666;">
                    <tr>
                        <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;">Type</td>
                        <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #111;">{notification.Type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0;">Sent at</td>
                        <td style="padding: 6px 0; text-align: right; color: #111;">{notification.CreatedAt:dd MMM yyyy, HH:mm} UTC</td>
                    </tr>
                </table>
            """;

            await emailService.SendAsync(user.Email, subject, emailBody);
            logger.LogInformation("Email notification sent to user {UserId} at {Email}", user.Id, user.Email);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send email notification to user {UserId}", user.Id);
        }

        await cache.RemoveByPrefixAsync(NotificationCachePrefix);

        logger.LogInformation("Notification created: {NotificationId} for user {UserId}", notification.Id, notification.UserId);

        var response = MapToResponse(notification);
        return Result<NotificationResponse>.Ok(response);
    }

    public async Task<Result<NotificationResponse>> UpdateAsync(UpdateNotificationRequest request, CancellationToken cancellationToken = default)
    {
        var notification = await unitOfWork.Notifications.GetByIdAsync(request.Id, cancellationToken);
        if (notification is null)
        {
            logger.LogWarning("Update failed - notification not found: {NotificationId}", request.Id);
            return Result<NotificationResponse>.Fail("Notification not found");
        }

        if (request.Title is not null)
            notification.Title = request.Title.Trim();

        if (request.Message is not null)
            notification.Message = request.Message.Trim();

        if (request.Type.HasValue)
            notification.Type = request.Type.Value;

        await unitOfWork.Notifications.UpdateAsync(notification, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(NotificationCachePrefix);

        logger.LogInformation("Notification updated: {NotificationId}", notification.Id);

        var response = MapToResponse(notification);
        return Result<NotificationResponse>.Ok(response);
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var notification = await unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification is null)
        {
            logger.LogWarning("Delete failed - notification not found: {NotificationId}", id);
            return Result<bool>.Fail("Notification not found");
        }

        await unitOfWork.Notifications.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(NotificationCachePrefix);

        logger.LogInformation("Notification deleted: {NotificationId}", id);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> MarkAsReadAsync(int id, CancellationToken cancellationToken = default)
    {
        var notification = await unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification is null)
        {
            logger.LogWarning("MarkAsRead failed - notification not found: {NotificationId}", id);
            return Result<bool>.Fail("Notification not found");
        }

        await unitOfWork.Notifications.MarkAsReadAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(NotificationCachePrefix);

        logger.LogInformation("Notification marked as read: {NotificationId}", id);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result<bool>.Fail("User not found", ErrorType.BadRequest);
        }

        await unitOfWork.Notifications.MarkAllAsReadAsync(userId, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(NotificationCachePrefix);

        logger.LogInformation("All notifications marked as read for user: {UserId}", userId);
        return Result<bool>.Ok(true);
    }

    private static NotificationResponse MapToResponse(Notification n)
    {
        return new NotificationResponse
        {
            Id = n.Id,
            UserId = n.UserId,
            UserName = n.User?.FullName ?? string.Empty,
            Title = n.Title,
            Message = n.Message,
            Type = n.Type.ToString(),
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt,
            ReadAt = n.ReadAt
        };
    }
}