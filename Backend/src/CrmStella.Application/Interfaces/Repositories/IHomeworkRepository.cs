using CrmStella.Domain.Entities;

namespace CrmStella.Application.Interfaces.Repositories;

public interface IHomeworkRepository
{
    Task<List<Homework>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Homework?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<List<Homework>> GetByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default);

    Task<List<Homework>> GetActiveByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default);

    Task<bool> ExistsByTitleInLessonAsync(
        int lessonId,
        string title,
        CancellationToken cancellationToken = default);

    Task CreateAsync(Homework homework, CancellationToken cancellationToken = default);

    Task UpdateAsync(Homework homework, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}