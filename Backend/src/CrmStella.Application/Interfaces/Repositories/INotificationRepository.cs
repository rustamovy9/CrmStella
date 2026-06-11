using CrmStella.Domain.Entities;

namespace CrmStella.Application.Interfaces.Repositories;

public interface INotificationRepository
{
    Task<List<Notification>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Notification?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<Notification>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<List<Notification>> GetUnreadByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default);
    Task CreateAsync(Notification notification, CancellationToken cancellationToken = default);
    Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(int id, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default);
}