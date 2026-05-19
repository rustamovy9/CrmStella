using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IExamRepository
{
    Task<List<Exam>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Exam>> GetByGroupAsync(int groupId, CancellationToken cancellationToken = default);
    Task<Exam?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task CreateAsync(Exam exam, CancellationToken cancellationToken = default);
    Task UpdateAsync(Exam exam, CancellationToken cancellationToken = default);
}