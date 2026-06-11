using CrmStella.Domain.Entities;

namespace CrmStella.Application.Interfaces.Repositories;

public interface ILessonRepository
{
    Task<List<Lesson>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Lesson?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<Lesson>> GetByCourseIdAsync(int courseId, CancellationToken cancellationToken = default);
    Task<List<Lesson>> GetByGroupIdAsync(int groupId, CancellationToken cancellationToken = default);
    Task<Lesson?> GetByTitleAsync(string title, CancellationToken cancellationToken = default);
    Task<bool> ExistsByTitleInCourseAsync(int courseId, string title, CancellationToken cancellationToken = default);
    Task<List<Lesson>> GetByGroupAndWeekAsync(int groupId, int weekNumber);
    Task CreateAsync(Lesson lesson, CancellationToken cancellationToken = default);
    Task UpdateAsync(Lesson lesson, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}