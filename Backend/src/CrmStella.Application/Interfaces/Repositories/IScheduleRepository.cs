using CrmStella.Domain.Entities;

namespace CrmStella.Application.Interfaces.Repositories;

public interface IScheduleRepository
{
    Task<(List<Schedule> Items, int TotalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search = null,
        DayOfWeek? dayOfWeek = null,
        int? groupId = null,
        CancellationToken cancellationToken = default);

    Task<List<Schedule>> GetByGroupIdAsync(int groupId, CancellationToken cancellationToken = default);
    Task<Schedule?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(int groupId, DayOfWeek dayOfWeek, CancellationToken cancellationToken = default);
    Task<Schedule> CreateAsync(Schedule schedule, CancellationToken cancellationToken = default);
    Task<Schedule> UpdateAsync(Schedule schedule, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}