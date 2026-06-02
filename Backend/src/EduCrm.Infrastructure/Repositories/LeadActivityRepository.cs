using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

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