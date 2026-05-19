using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IHomeworkRepository
{
    Task<List<Homework>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Homework>> GetByLessonAsync(int lessonId, CancellationToken cancellationToken = default);
    Task<Homework?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task CreateAsync(Homework homework, CancellationToken cancellationToken = default);
    Task UpdateAsync(Homework homework, CancellationToken cancellationToken = default);
}