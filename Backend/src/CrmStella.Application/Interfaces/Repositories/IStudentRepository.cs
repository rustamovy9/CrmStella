// IStudentRepository.cs

using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Student.Request;
using CrmStella.Domain.Entities;

namespace CrmStella.Application.Interfaces.Repositories;

public interface IStudentRepository
{
    Task<PagedResult<Student>> GetAllAsync(
        StudentQueryRequest query,
        CancellationToken cancellationToken = default);

    Task<Student?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Student?> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task CreateAsync(Student student, CancellationToken cancellationToken = default);
    Task UpdateAsync(Student student, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}