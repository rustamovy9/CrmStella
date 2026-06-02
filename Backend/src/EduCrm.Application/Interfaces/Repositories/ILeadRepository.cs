using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Lead.Request;
using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface ILeadRepository
{
    Task<Lead?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<PagedResult<Lead>> GetAllAsync(LeadQueryRequest query, CancellationToken ct = default);
    Task CreateAsync(Lead lead, CancellationToken ct = default);
    Task UpdateAsync(Lead lead, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByPhoneAsync(string phone, CancellationToken ct = default);
}