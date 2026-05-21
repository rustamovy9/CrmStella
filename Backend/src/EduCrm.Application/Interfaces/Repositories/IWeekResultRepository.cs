using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IWeekResultRepository
{
    Task<WeekResult?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<WeekResult?> GetByKeyAsync(int studentId, int groupId, int weekNumber,
        CancellationToken cancellationToken = default);

    Task<List<WeekResult>> GetByStudentAndGroupAsync(int studentId, int groupId,
        CancellationToken cancellationToken = default);

    Task<List<WeekResult>> GetByGroupAndWeekAsync(int groupId, int weekNumber,
        CancellationToken cancellationToken = default);

    Task CreateAsync(WeekResult weekResult, CancellationToken cancellationToken = default);
    Task UpdateAsync(WeekResult weekResult, CancellationToken cancellationToken = default);
}