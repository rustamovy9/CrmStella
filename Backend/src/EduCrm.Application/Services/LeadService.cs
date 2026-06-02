using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Lead.Request;
using EduCrm.Application.DTOs.Lead.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class LeadService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IAuditLogService auditLogService,
    ILogger<LeadService> logger) : ILeadService
{
    private const string LeadCachePrefix = "leads:";

    public async Task<Result<PagedResult<LeadResponse>>> GetAllAsync(LeadQueryRequest query)
    {
        var paged = await unitOfWork.Leads.GetAllAsync(query);

        var result = new PagedResult<LeadResponse>
        {
            Items = paged.Items.Select(MapToResponse).ToList(),
            TotalCount = paged.TotalCount,
            Page = paged.Page,
            PageSize = paged.PageSize
        };

        return Result<PagedResult<LeadResponse>>.Ok(result);
    }

    public async Task<Result<LeadDetailsResponse>> GetByIdAsync(int id)
    {
        var lead = await unitOfWork.Leads.GetByIdAsync(id);
        if (lead is null)
            return Result<LeadDetailsResponse>.Fail("Lead not found");

        var activities = await unitOfWork.LeadActivities.GetByLeadIdAsync(id);

        var response = new LeadDetailsResponse
        {
            Id = lead.Id,
            FullName = lead.FullName,
            Phone = lead.Phone,
            Email = lead.Email,
            Source = lead.Source.ToString(),
            Status = lead.Status.ToString(),
            InterestedCourseId = lead.InterestedCourseId,
            InterestedCourseName = lead.InterestedCourse?.Name,
            AssignedManagerId = lead.AssignedManagerId,
            AssignedManagerName = lead.AssignedManager?.FullName,
            Notes = lead.Notes,
            NextFollowUpAt = lead.NextFollowUpAt,
            ConvertedToStudentId = lead.ConvertedToStudentId,
            LostReason = lead.LostReason,
            CreatedAt = lead.CreatedAt,
            UpdatedAt = lead.UpdatedAt,
            Activities = activities.Select(a => new LeadActivityResponse
            {
                Id = a.Id,
                UserId = a.UserId,
                UserFullName = a.User?.FullName ?? "",
                Type = a.Type,
                Description = a.Description,
                CreatedAt = a.CreatedAt
            }).OrderByDescending(a => a.CreatedAt).ToList()
        };

        return Result<LeadDetailsResponse>.Ok(response);
    }

    public async Task<Result<LeadResponse>> CreateAsync(CreateLeadRequest request, int userId)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Phone))
            return Result<LeadResponse>.Fail("FullName and Phone are required", ErrorType.BadRequest);

        if (await unitOfWork.Leads.ExistsByPhoneAsync(request.Phone))
            return Result<LeadResponse>.Fail("Lead with this phone already exists", ErrorType.Conflict);

        if (request.InterestedCourseId is not null)
        {
            var course = await unitOfWork.Courses.GetByIdAsync(request.InterestedCourseId.Value);
            if (course is null)
                return Result<LeadResponse>.Fail("Course not found", ErrorType.BadRequest);
        }

        var lead = new Lead
        {
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email?.Trim(),
            Source = (LeadSource)request.Source,
            Status = LeadStatus.New,
            InterestedCourseId = request.InterestedCourseId,
            Notes = request.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await unitOfWork.Leads.CreateAsync(lead);
        await unitOfWork.SaveChangesAsync(); // ← сначала сохраняем лида, теперь у него есть Id

        await unitOfWork.LeadActivities.CreateAsync(new LeadActivity
        {
            LeadId = lead.Id,
            UserId = userId,
            Type = "system",
            Description = "Лид создан",
            CreatedAt = DateTime.UtcNow
        });

        await unitOfWork.SaveChangesAsync(); // ← потом активность

        await auditLogService.LogAsync(userId, AuditActions.CreateLead, "Lead", lead.Id,
            newValues: new { lead.FullName, lead.Phone, lead.Source, lead.Status });

        await cache.RemoveByPrefixAsync(LeadCachePrefix);

        logger.LogInformation("Lead created: {LeadId} {Name}", lead.Id, lead.FullName);

        var created = await unitOfWork.Leads.GetByIdAsync(lead.Id);
        return Result<LeadResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<LeadResponse>> UpdateAsync(int id, UpdateLeadRequest request, int userId)
    {
        var lead = await unitOfWork.Leads.GetByIdAsync(id);
        if (lead is null)
            return Result<LeadResponse>.Fail("Lead not found");

        var oldValues = new { lead.FullName, lead.Phone, lead.Email, lead.Source, lead.Notes };

        if (request.FullName is not null) lead.FullName = request.FullName.Trim();
        if (request.Phone is not null) lead.Phone = request.Phone.Trim();
        if (request.Email is not null) lead.Email = request.Email.Trim();
        if (request.Source is not null) lead.Source = (LeadSource)request.Source.Value;
        if (request.InterestedCourseId is not null) lead.InterestedCourseId = request.InterestedCourseId;
        if (request.Notes is not null) lead.Notes = request.Notes.Trim();
        if (request.NextFollowUpAt is not null)
            lead.NextFollowUpAt = DateTime.SpecifyKind(request.NextFollowUpAt.Value, DateTimeKind.Utc);

        lead.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.Leads.UpdateAsync(lead);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(userId, AuditActions.UpdateLead, "Lead", lead.Id, oldValues,
            new { lead.FullName, lead.Phone, lead.Email, lead.Source, lead.Notes });

        await cache.RemoveByPrefixAsync(LeadCachePrefix);

        var updated = await unitOfWork.Leads.GetByIdAsync(lead.Id);
        return Result<LeadResponse>.Ok(MapToResponse(updated!));
    }

    public async Task<Result<LeadResponse>> ChangeStatusAsync(int id, ChangeLeadStatusRequest request, int userId)
    {
        var lead = await unitOfWork.Leads.GetByIdAsync(id);
        if (lead is null)
            return Result<LeadResponse>.Fail("Lead not found");

        var newStatus = (LeadStatus)request.Status;
        var oldStatus = lead.Status;

        if (oldStatus == newStatus)
            return Result<LeadResponse>.Fail("Status is already set", ErrorType.BadRequest);

        if (oldStatus == LeadStatus.Converted)
            return Result<LeadResponse>.Fail("Cannot change status of converted lead", ErrorType.BadRequest);

        lead.Status = newStatus;
        lead.UpdatedAt = DateTime.UtcNow;

        if (newStatus == LeadStatus.Lost)
            lead.LostReason = request.LostReason?.Trim();

        await unitOfWork.LeadActivities.CreateAsync(new LeadActivity
        {
            LeadId = lead.Id,
            UserId = userId,
            Type = "status_change",
            Description = $"Статус изменён: {oldStatus} → {newStatus}" +
                          (request.Comment is not null ? $". {request.Comment}" : ""),
            CreatedAt = DateTime.UtcNow
        });

        await unitOfWork.Leads.UpdateAsync(lead);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(userId, AuditActions.ChangeLeadStatus, "Lead", lead.Id,
            new { Status = oldStatus }, new { Status = newStatus });

        await cache.RemoveByPrefixAsync(LeadCachePrefix);

        var updated = await unitOfWork.Leads.GetByIdAsync(lead.Id);
        return Result<LeadResponse>.Ok(MapToResponse(updated!));
    }

    public async Task<Result<LeadResponse>> AssignManagerAsync(int id, AssignLeadManagerRequest request, int userId)
    {
        var lead = await unitOfWork.Leads.GetByIdAsync(id);
        if (lead is null)
            return Result<LeadResponse>.Fail("Lead not found");

        var manager = await unitOfWork.Users.GetByIdAsync(request.ManagerId);
        if (manager is null)
            return Result<LeadResponse>.Fail("Manager not found", ErrorType.BadRequest);

        var oldManagerId = lead.AssignedManagerId;
        lead.AssignedManagerId = request.ManagerId;
        lead.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.LeadActivities.CreateAsync(new LeadActivity
        {
            LeadId = lead.Id,
            UserId = userId,
            Type = "assign",
            Description = $"Назначен менеджер: {manager.FullName}",
            CreatedAt = DateTime.UtcNow
        });

        await unitOfWork.Leads.UpdateAsync(lead);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(userId, AuditActions.AssignLeadManager, "Lead", lead.Id,
            new { ManagerId = oldManagerId }, new { request.ManagerId });

        await cache.RemoveByPrefixAsync(LeadCachePrefix);

        var updated = await unitOfWork.Leads.GetByIdAsync(lead.Id);
        return Result<LeadResponse>.Ok(MapToResponse(updated!));
    }

    public async Task<Result<LeadActivityResponse>> AddActivityAsync(int id, CreateLeadActivityRequest request,
        int userId)
    {
        var lead = await unitOfWork.Leads.GetByIdAsync(id);
        if (lead is null)
            return Result<LeadActivityResponse>.Fail("Lead not found");

        if (string.IsNullOrWhiteSpace(request.Description))
            return Result<LeadActivityResponse>.Fail("Description is required", ErrorType.BadRequest);

        var activity = new LeadActivity
        {
            LeadId = id,
            UserId = userId,
            Type = request.Type?.Trim() ?? "note",
            Description = request.Description.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await unitOfWork.LeadActivities.CreateAsync(activity);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(LeadCachePrefix);

        var user = await unitOfWork.Users.GetByIdAsync(userId);

        return Result<LeadActivityResponse>.Ok(new LeadActivityResponse
        {
            Id = activity.Id,
            UserId = userId,
            UserFullName = user?.FullName ?? "",
            Type = activity.Type,
            Description = activity.Description,
            CreatedAt = activity.CreatedAt
        });
    }

    public async Task<Result<bool>> DeleteAsync(int id, int userId)
    {
        var lead = await unitOfWork.Leads.GetByIdAsync(id);
        if (lead is null)
            return Result<bool>.Fail("Lead not found");

        if (lead.Status == LeadStatus.Converted)
            return Result<bool>.Fail("Cannot delete converted lead", ErrorType.BadRequest);

        await auditLogService.LogAsync(userId, AuditActions.DeleteLead, "Lead", lead.Id,
            new { lead.FullName, lead.Phone, lead.Status });

        await unitOfWork.Leads.DeleteAsync(id);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(LeadCachePrefix);

        return Result<bool>.Ok(true);
    }

    private static LeadResponse MapToResponse(Lead l)
    {
        return new LeadResponse
        {
            Id = l.Id,
            FullName = l.FullName,
            Phone = l.Phone,
            Email = l.Email,
            Source = l.Source.ToString(),
            Status = l.Status.ToString(),
            InterestedCourseId = l.InterestedCourseId,
            InterestedCourseName = l.InterestedCourse?.Name,
            AssignedManagerId = l.AssignedManagerId,
            AssignedManagerName = l.AssignedManager?.FullName,
            Notes = l.Notes,
            NextFollowUpAt = l.NextFollowUpAt,
            ConvertedToStudentId = l.ConvertedToStudentId,
            LostReason = l.LostReason,
            CreatedAt = l.CreatedAt,
            UpdatedAt = l.UpdatedAt
        };
    }
}