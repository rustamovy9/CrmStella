using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Lead.Request;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class LeadRepository(AppDbContext context) : ILeadRepository
{
    public async Task<Lead?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await context.Leads
            .Include(l => l.InterestedCourse)
            .Include(l => l.AssignedManager)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id, ct);
    }

    public async Task<PagedResult<Lead>> GetAllAsync(LeadQueryRequest query, CancellationToken ct = default)
    {
        var q = context.Leads
            .Include(l => l.InterestedCourse)
            .Include(l => l.AssignedManager)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(l =>
                l.FullName.ToLower().Contains(s) ||
                l.Phone.Contains(s) ||
                (l.Email != null && l.Email.ToLower().Contains(s)));
        }

        if (query.Status is not null)
            q = q.Where(l => l.Status == (LeadStatus)query.Status.Value);

        if (query.Source is not null)
            q = q.Where(l => l.Source == (LeadSource)query.Source.Value);

        if (query.ManagerId is not null)
            q = q.Where(l => l.AssignedManagerId == query.ManagerId.Value);

        var totalCount = await q.CountAsync(ct);

        var items = await q
            .OrderByDescending(l => l.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        return new PagedResult<Lead>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task CreateAsync(Lead lead, CancellationToken ct = default)
    {
        await context.Leads.AddAsync(lead, ct);
    }

    public Task UpdateAsync(Lead lead, CancellationToken ct = default)
    {
        context.Leads.Update(lead);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var lead = await context.Leads.FindAsync(new object[] { id }, ct);
        if (lead is not null)
            context.Leads.Remove(lead);
    }

    public async Task<bool> ExistsByPhoneAsync(string phone, CancellationToken ct = default)
    {
        return await context.Leads.AnyAsync(l => l.Phone == phone, ct);
    }
}