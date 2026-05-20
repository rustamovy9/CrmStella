using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IAuditLogRepository
{
    Task<List<AuditLog>> QueryAsync(
        int? userId,
        string? entityName,
        int? entityId,
        DateTime? fromDate,
        DateTime? toDate,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task CreateAsync(AuditLog log, CancellationToken cancellationToken = default);
}