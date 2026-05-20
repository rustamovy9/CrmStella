using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Notification.Request;
using EduCrm.Application.DTOs.Notification.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface INotificationService
{
    Task<Result<List<NotificationResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Result<NotificationResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<List<NotificationResponse>>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<Result<List<NotificationResponse>>> GetUnreadByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<Result<int>> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default);
    Task<Result<NotificationResponse>> CreateAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default);
    Task<Result<NotificationResponse>> UpdateAsync(UpdateNotificationRequest request, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<bool>> MarkAsReadAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<bool>> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default);
}