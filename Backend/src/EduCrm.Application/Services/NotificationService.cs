using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Notification.Request;
using EduCrm.Application.DTOs.Notification.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class NotificationService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<NotificationService> logger,
    IEmailService emailService,
    IAuditLogService auditLogService) : INotificationService
{
    private const string NotificationCachePrefix = "notifications:";
    private const string NotificationListCacheKey = "notifications:list";

    public async Task<Result<List<NotificationResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var cached = await cache.GetAsync<List<NotificationResponse>>(NotificationListCacheKey);
        if (cached is not null)
            return Result<List<NotificationResponse>>.Ok(cached);

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
            return Result<NotificationResponse>.Ok(cached);

        var notification = await unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification is null)
        {
            logger.LogWarning("Notification not found: {Id}", id);
            return Result<NotificationResponse>.Fail("Notification not found");
        }

        var response = MapToResponse(notification);

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));

        return Result<NotificationResponse>.Ok(response);
    }

    public async Task<Result<List<NotificationResponse>>> GetByUserIdAsync(int userId,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{NotificationCachePrefix}user:{userId}";

        var cached = await cache.GetAsync<List<NotificationResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<NotificationResponse>>.Ok(cached);

        var user = await unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user is null)
            return Result<List<NotificationResponse>>.Fail("User not found", ErrorType.BadRequest);

        var notifications = await unitOfWork.Notifications.GetByUserIdAsync(userId, cancellationToken);

        var result = notifications.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5));

        return Result<List<NotificationResponse>>.Ok(result);
    }

    public async Task<Result<List<NotificationResponse>>> GetUnreadByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var user = await unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user is null)
            return Result<List<NotificationResponse>>.Fail("User not found", ErrorType.BadRequest);

        var notifications = await unitOfWork.Notifications.GetUnreadByUserIdAsync(userId, cancellationToken);

        var result = notifications.Select(MapToResponse).ToList();

        return Result<List<NotificationResponse>>.Ok(result);
    }

    public async Task<Result<int>> GetUnreadCountAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var user = await unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user is null)
            return Result<int>.Fail("User not found", ErrorType.BadRequest);

        var count = await unitOfWork.Notifications.GetUnreadCountAsync(userId, cancellationToken);

        return Result<int>.Ok(count);
    }

    public async Task<Result<NotificationResponse>> CreateAsync(CreateNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null)
            return Result<NotificationResponse>.Fail("User not found", ErrorType.BadRequest);

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

        await auditLogService.LogAsync(
            null,
            AuditActions.CreateNotification,
            nameof(Notification),
            notification.Id,
            newValues: request
        );

        try
        {
            var subject = notification.Title;

            var emailBody = $"""
                                 <h2>{notification.Title}</h2>
                                 <p>{notification.Message}</p>
                                 <hr/>
                                 <p>Type: {notification.Type}</p>
                                 <p>Sent: {notification.CreatedAt:dd MMM yyyy HH:mm} UTC</p>
                             """;

            await emailService.SendAsync(user.Email, subject, emailBody);

            logger.LogInformation("Email sent to user {UserId}", user.Id);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Email send failed for user {UserId}", user.Id);
        }

        await cache.RemoveByPrefixAsync(NotificationCachePrefix);

        return Result<NotificationResponse>.Ok(MapToResponse(notification));
    }

    public async Task<Result<NotificationResponse>> UpdateAsync(UpdateNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var notification = await unitOfWork.Notifications.GetByIdAsync(request.Id, cancellationToken);
        if (notification is null)
            return Result<NotificationResponse>.Fail("Notification not found");

        var oldValues = new
        {
            notification.Title,
            notification.Message,
            notification.Type
        };

        if (request.Title is not null)
            notification.Title = request.Title.Trim();

        if (request.Message is not null)
            notification.Message = request.Message.Trim();

        if (request.Type.HasValue)
            notification.Type = request.Type.Value;

        await unitOfWork.Notifications.UpdateAsync(notification, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdateNotification,
            nameof(Notification),
            notification.Id,
            oldValues,
            request
        );

        await cache.RemoveByPrefixAsync(NotificationCachePrefix);

        return Result<NotificationResponse>.Ok(MapToResponse(notification));
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var notification = await unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification is null)
            return Result<bool>.Fail("Notification not found");

        await unitOfWork.Notifications.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await auditLogService.LogAsync(
            null,
            AuditActions.DeleteNotification,
            nameof(Notification),
            id,
            notification
        );

        await cache.RemoveByPrefixAsync(NotificationCachePrefix);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> MarkAsReadAsync(int id, CancellationToken cancellationToken = default)
    {
        var notification = await unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification is null)
            return Result<bool>.Fail("Notification not found");

        var oldValues = new { notification.IsRead };

        await unitOfWork.Notifications.MarkAsReadAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await auditLogService.LogAsync(
            notification.UserId,
            AuditActions.MarkNotificationAsRead,
            nameof(Notification),
            id,
            oldValues,
            new { IsRead = true }
        );

        await cache.RemoveByPrefixAsync(NotificationCachePrefix);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user is null)
            return Result<bool>.Fail("User not found", ErrorType.BadRequest);

        await unitOfWork.Notifications.MarkAllAsReadAsync(userId, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await auditLogService.LogAsync(
            userId,
            AuditActions.MarkAllNotificationsAsRead,
            nameof(Notification),
            null,
            newValues: new { userId }
        );

        await cache.RemoveByPrefixAsync(NotificationCachePrefix);

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