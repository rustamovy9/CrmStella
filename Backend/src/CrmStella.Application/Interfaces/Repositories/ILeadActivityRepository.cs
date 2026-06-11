using CrmStella.Domain.Entities;

namespace CrmStella.Application.Interfaces.Repositories;

public interface ILeadActivityRepository
{
    Task CreateAsync(LeadActivity activity, CancellationToken ct = default);
    Task<List<LeadActivity>> GetByLeadIdAsync(int leadId, CancellationToken ct = default);
}