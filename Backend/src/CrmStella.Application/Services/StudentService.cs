using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Group.Response;
using CrmStella.Application.DTOs.Student.Request;
using CrmStella.Application.DTOs.Student.Response;
using CrmStella.Application.DTOs.Students.Request;
using CrmStella.Application.DTOs.Users.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Constants;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CrmStella.Application.Services;

public class StudentService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IAuditLogService auditLogService,
    ILogger<StudentService> logger) : IStudentService
{
    private const string StudentCachePrefix = "students:";
    private const string StudentListCacheKey = "students:list";

    public async Task<Result<PagedResult<StudentListItemResponse>>> GetAllAsync(
        StudentQueryRequest query,
        CancellationToken cancellationToken = default)
    {
        var cacheKey =
            $"{StudentCachePrefix}list:{query.Page}:{query.PageSize}:{query.Search}:{query.IsActive}:{query.GroupId}";

        var cached = await cache.GetAsync<PagedResult<StudentListItemResponse>>(cacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Students list served from cache");
            return Result<PagedResult<StudentListItemResponse>>.Ok(cached);
        }

        var pagedStudents = await unitOfWork.Students.GetAllAsync(query, cancellationToken);

        var result = new PagedResult<StudentListItemResponse>
        {
            Items = pagedStudents.Items.Select(s => new StudentListItemResponse
            {
                Id = s.Id,
                UserId = s.UserId,
                FullName = s.User.FullName,
                Email = s.User.Email,
                Balance = s.Balance,
                IsActive = s.IsActive,
                AvatarUrl = s.User.Profile?.AvatarUrl,
                EnrolledAt = s.EnrolledAt
            }).ToList(),
            TotalCount = pagedStudents.TotalCount,
            Page = pagedStudents.Page,
            PageSize = pagedStudents.PageSize
        };

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10));

        return Result<PagedResult<StudentListItemResponse>>.Ok(result);
    }

    public async Task<Result<UserDetailResponse>> GetByIdAsync(int id)
    {
        var user = await unitOfWork.Users.GetByIdAsync(id);
        if (user is null)
            return Result<UserDetailResponse>.Fail("User not found");

        var response = new UserDetailResponse
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role?.Name ?? string.Empty,
            IsActive = user.IsActive,
            IsPasswordSet = user.IsPasswordSet,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,

            // Из Profile
            AvatarUrl = user.Profile?.AvatarUrl,
            AboutMe = user.Profile?.AboutMe,
            TelegramUsername = user.Profile?.TelegramUsername,
            GithubUrl = user.Profile?.GithubUrl
        };

        // ✅ Добавляем данные Student/Mentor
        if (user.RoleId == 3) // Student
        {
            var student = await unitOfWork.Students.GetByUserIdAsync(id);
            if (student is not null)
            {
                response.Balance = student.Balance;
                response.EnrolledAt = student.EnrolledAt;
            }
        }
        else if (user.RoleId == 2) // Mentor
        {
            var mentor = await unitOfWork.Mentors.GetByUserIdAsync(id);
            if (mentor is not null)
            {
                response.Specialization = mentor.Specialization;
                response.ExperienceYears = mentor.ExperienceYears;
                response.HireDate = mentor.HireDate;
            }
        }

        return Result<UserDetailResponse>.Ok(response);
    }

    public async Task<Result<StudentResponse>> UpdateAsync(int id, UpdateStudentRequest request)
    {
        var student = await unitOfWork.Students.GetByIdAsync(id);
        if (student is null)
        {
            logger.LogWarning("Update failed - student not found: {StudentId}", id);
            return Result<StudentResponse>.Fail("Student not found");
        }

        var oldValues = new
        {
            student.Balance,
            student.EnrolledAt,
            student.IsActive
        };

        if (request.Balance is not null)
            student.Balance = request.Balance.Value;

        if (request.EnrolledAt is not null)
            student.EnrolledAt = request.EnrolledAt.Value;

        await unitOfWork.Students.UpdateAsync(student);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdateStudent,
            nameof(Student),
            student.Id,
            oldValues,
            request
        );

        await cache.RemoveByPrefixAsync(StudentCachePrefix);
        await cache.RemoveByPrefixAsync("users:");

        logger.LogInformation("Student updated: {StudentId}", id);

        return Result<StudentResponse>.Ok(MapToResponse(student));
    }

    public async Task<Result<bool>> SetStatusAsync(int id, SetStudentStatusRequest request)
    {
        var student = await unitOfWork.Students.GetByIdAsync(id);
        if (student is null)
        {
            logger.LogWarning("SetStatus failed - student not found: {StudentId}", id);
            return Result<bool>.Fail("Student not found");
        }

        var oldValues = new { student.IsActive };

        student.IsActive = request.IsActive;

        await unitOfWork.Students.UpdateAsync(student);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            null,
            request.IsActive ? AuditActions.ActivateUser : AuditActions.DeactivateUser,
            nameof(Student),
            student.Id,
            oldValues,
            new { request.IsActive }
        );

        await cache.RemoveByPrefixAsync(StudentCachePrefix);

        logger.LogInformation(
            "Student status changed: {StudentId} IsActive: {IsActive}",
            id, request.IsActive);

        return Result<bool>.Ok(true);
    }

    private static StudentResponse MapToResponse(Student s)
    {
        return new StudentResponse
        {
            Id = s.Id,
            UserId = s.UserId,
            FullName = s.User.FullName,
            Email = s.User.Email,
            PhoneNumber = s.User.PhoneNumber,
            AvatarUrl = s.User.Profile?.AvatarUrl,
            ImageUrl = s.User.Profile?.AvatarUrl,
            Balance = s.Balance,
            IsActive = s.IsActive,
            EnrolledAt = s.EnrolledAt,
            GroupsCount = s.GroupStudents?.Count ?? 0
        };
    }

    public async Task<Result<StudentDashboardResponse>> GetDashboardAsync(int userId)
    {
        var student = await unitOfWork.Students.GetByUserIdAsync(userId);

        if (student is null)
        {
            return Result<StudentDashboardResponse>.Fail("Student not found", ErrorType.NotFound);
        }

        var enrollments = await unitOfWork.GroupStudents.GetByStudentAsync(student.Id);


        //Groups
        var groups = enrollments
            .Select(x => x.Group)
            .DistinctBy(x => x.Id)
            .ToList();

        var activeGroups =
            groups.Count(x =>
                x.Status == GroupStatus.Active);

        var completedGroups =
            groups.Count(x =>
                x.Status == GroupStatus.Completed);

        var totalGroups = groups.Count();

        //Attendances
        var attendances = await unitOfWork.Attendances
            .GetByStudentIdAsync(student.Id);

        var totalAttendances = attendances.Count();

        var presentCount =
            attendances.Count(x => x.Status == AttendanceStatus.Present);

        var absences =
            attendances.Count(x => x.Status == AttendanceStatus.Absent);

        var lateMinutes =
            attendances.
                Where(x => x.LateMinutes.HasValue)
                .Sum(x => x.LateMinutes!.Value);

        var attendancePercent =
            totalAttendances == 0
                ? 0
                : Math.Round(presentCount * 100d / totalAttendances, 1);

        //Score
        var scores = await unitOfWork.LessonScores
            .GetByStudentIdAsync(student.Id);

        var averageScore =
            scores.Count == 0
                ? 0
                : Math.Round(scores.Average(x => x.Score), 1);

        var recentScores = scores
            .OrderByDescending(x => x.ScoredAt)
            .Take(5)
            .Select(x => new StudentDashboardScoreResponse
            {
                LessonName = x.Lesson.Title,
                Score = x.Score,
                Comment = x.MentorFeedback,
                Date = x.ScoredAt,
            }).ToList();

        //Groupi
        var groupResponses = groups
            .Select(g =>
            {
                var activeCount =
                    g.GroupStudents.Count(x => x.IsActive);

                return new GroupListItemResponse
                {
                    Id = g.Id,
                    Name = g.Name,
                    CourseId = g.CourseId,
                    CourseName = g.Course.Name,
                    MentorId = g.MentorId,
                    MentorUserId = g.Mentor.UserId,
                    MentorName = g.Mentor.User.FullName,
                    StartDate = g.StartDate,
                    EndDate = g.EndDate,
                    MaxStudents = g.MaxStudents,
                    ActiveStudentsCount = activeCount,
                    FreeSlots = g.MaxStudents - activeCount,
                    Status = g.Status.ToString(),
                    CreatedAt = g.CreatedAt
                };
            }).ToList();

        var response =
            new StudentDashboardResponse
            {
                AverageScore = averageScore,
                AttendancePercent = attendancePercent,
                ActiveGroups = activeGroups,
                CompletedGroups = completedGroups,
                Absences = absences,
                LateMinutes = lateMinutes,
                TotalGroups = totalGroups,
                RecentScores = recentScores,
                Groups = groupResponses
            };
        
        return Result<StudentDashboardResponse>.Ok(response);
    }
}