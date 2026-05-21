using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IStudentProgressRepository
{
    Task<StudentProgress?> GetByStudentAndGroupAsync(int studentId, int groupId,
        CancellationToken cancellationToken = default);

    Task<List<StudentProgress>> GetByGroupAsync(int groupId, CancellationToken cancellationToken = default);

    Task CreateAsync(StudentProgress progress, CancellationToken cancellationToken = default);
    Task UpdateAsync(StudentProgress progress, CancellationToken cancellationToken = default);
}