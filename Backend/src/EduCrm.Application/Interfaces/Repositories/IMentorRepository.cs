// IMentorRepository.cs

using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Mentor.Request;
using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IMentorRepository
{
    Task<PagedResult<Mentor>> GetAllAsync(
        MentorQueryRequest query,
        CancellationToken cancellationToken = default);

    Task<Mentor?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Mentor?> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task CreateAsync(Mentor mentor, CancellationToken cancellationToken = default);
    Task UpdateAsync(Mentor mentor, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}