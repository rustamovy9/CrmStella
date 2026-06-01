using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class AuditLogRepository(AppDbContext context) : IAuditLogRepository
{
    public async Task<List<AuditLog>> QueryAsync(
        int? userId,
        string? entityName,
        int? entityId,
        DateTime? fromDate,
        DateTime? toDate,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = context.AuditLogs
            .Include(a => a.User)
            .AsQueryable();

        if (userId is not null)
            query = query.Where(a => a.UserId == userId);

        if (!string.IsNullOrWhiteSpace(entityName))
            query = query.Where(a => EF.Functions.ILike(a.EntityName, $"%{entityName}%"));

        if (entityId is not null)
            query = query.Where(a => a.EntityId == entityId);

        if (fromDate is not null)
            query = query.Where(a => a.CreatedAt >= fromDate);

        if (toDate is not null)
            query = query.Where(a => a.CreatedAt <= toDate);

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task CreateAsync(
        AuditLog log,
        CancellationToken cancellationToken = default)
    {
        await context.AuditLogs.AddAsync(log, cancellationToken);
    }
}