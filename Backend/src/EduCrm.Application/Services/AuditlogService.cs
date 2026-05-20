using System.Text.Json;
using EduCrm.Application.Common;
using EduCrm.Application.DTOs.AuditLog.Request;
using EduCrm.Application.DTOs.AuditLog.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class AuditLogService(
    IUnitOfWork unitOfWork,
    ILogger<AuditLogService> logger) : IAuditLogService
{
    public async Task<Result<List<AuditLogResponse>>> QueryAsync(AuditLogQuery query)
    {
        // защита от абузивных размеров страницы
        var pageSize = query.PageSize is < 1 or > 200 ? 50 : query.PageSize;
        var page = query.Page < 1 ? 1 : query.Page;

        var logs = await unitOfWork.AuditLogs.QueryAsync(
            query.UserId,
            query.EntityName,
            query.EntityId,
            query.FromDate,
            query.ToDate,
            page,
            pageSize);

        var result = logs.Select(a => new AuditLogResponse
        {
            Id = a.Id,
            UserId = a.UserId,
            UserName = a.User?.FullName,
            Action = a.Action,
            EntityName = a.EntityName,
            EntityId = a.EntityId,
            OldValues = a.OldValues,
            NewValues = a.NewValues,
            IpAddress = a.IpAddress,
            CreatedAt = a.CreatedAt
        }).ToList();

        return Result<List<AuditLogResponse>>.Ok(result);
        // НЕ кэшируем: аудит должен показывать всегда свежие данные,
        // устаревший журнал расследования бесполезен
    }

    public async Task LogAsync(
        int? userId,
        string action,
        string entityName,
        int? entityId,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        try
        {
            var log = new Domain.Entities.AuditLog
            {
                UserId = userId,
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                OldValues = oldValues is null ? null : JsonSerializer.Serialize(oldValues),
                NewValues = newValues is null ? null : JsonSerializer.Serialize(newValues),
                IpAddress = ipAddress,
                UserAgent = userAgent,
                CreatedAt = DateTime.UtcNow
            };

            await unitOfWork.AuditLogs.CreateAsync(log);
            await unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // КРИТИЧЕСКИ ВАЖНО по-сеньорски:
            // сбой аудита НЕ должен ронять бизнес-операцию.
            // Не смогли записать в журнал — логируем в ILogger и идём дальше,
            // а не валим, например, создание платежа из-за того,
            // что аудит не записался.
            logger.LogError(ex,
                "Failed to write audit log: {Action} {Entity} {EntityId}",
                action, entityName, entityId);
        }
    }
}