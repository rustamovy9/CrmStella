using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Domain.Entities;
using CrmStella.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmStella.Infrastructure.Repositories;

public class LeadActivityRepository(AppDbContext context) : ILeadActivityRepository
{
    public async Task CreateAsync(LeadActivity activity, CancellationToken ct = default)
    {
        await context.LeadActivities.AddAsync(activity, ct);
    }

    public async Task<List<LeadActivity>> GetByLeadIdAsync(int leadId, CancellationToken ct = default)
    {
        return await context.LeadActivities
            .Include(a => a.User)
            .AsNoTracking()
            .Where(a => a.LeadId == leadId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
    }
}