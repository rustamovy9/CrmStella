using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Users.Request;
using CrmStella.Application.DTOs.Users.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Constants;
using CrmStella.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace CrmStella.Application.Services;

public class UserService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IAuditLogService auditLogService,
    ILogger<UserService> logger) : IUserService
{
    private const string AllUsersCacheKey = "users:all";
    private const string UserCachePrefix = "users:";

    public async Task<Result<List<UserResponse>>> GetAllAsync()
    {
        var cached = await cache.GetAsync<List<UserResponse>>(AllUsersCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("GetAllUsers - returned from cache");
            return Result<List<UserResponse>>.Ok(cached);
        }

        var users = await unitOfWork.Users.GetAllAsync();
        var response = users.Select(MapToResponse).ToList();

        await cache.SetAsync(AllUsersCacheKey, response, TimeSpan.FromMinutes(5));

        return Result<List<UserResponse>>.Ok(response);
    }

    public async Task<Result<List<UserResponse>>> GetByRoleAsync(int roleId)
    {
        var cacheKey = $"users:role:{roleId}";

        var cached = await cache.GetAsync<List<UserResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<UserResponse>>.Ok(cached);

        var users = await unitOfWork.Users.GetByRoleAsync(roleId);
        var response = users.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));

        return Result<List<UserResponse>>.Ok(response);
    }

    public async Task<Result<UserDetailResponse>> GetByIdAsync(int id)
    {
        var cacheKey = $"users:{id}";

        var cached = await cache.GetAsync<UserDetailResponse>(cacheKey);
        if (cached is not null)
            return Result<UserDetailResponse>.Ok(cached);

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
            AvatarUrl = user.Profile?.AvatarUrl,
            AboutMe = user.Profile?.AboutMe,
            TelegramUsername = user.Profile?.TelegramUsername,
            GithubUrl = user.Profile?.GithubUrl
        };

        if (user.RoleId == 3) // Student
        {
            var student = await unitOfWork.Students.GetByUserIdAsync(id);
            if (student is not null)
            {
                response.StudentId = student.Id; // ✅
                response.Balance = student.Balance;
                response.EnrolledAt = student.EnrolledAt;
            }
        }
        else if (user.RoleId == 2) // Mentor
        {
            var mentor = await unitOfWork.Mentors.GetByUserIdAsync(id);
            if (mentor is not null)
            {
                response.MentorId = mentor.Id; // ✅
                response.Specialization = mentor.Specialization;
                response.ExperienceYears = mentor.ExperienceYears;
                response.HireDate = mentor.HireDate;
            }
        }

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));

        return Result<UserDetailResponse>.Ok(response);
    }

    public async Task<Result<UserDetailResponse>> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await unitOfWork.Users.GetByIdAsync(id);
        if (user is null)
            return Result<UserDetailResponse>.Fail("User not found");

        var oldValues = new { user.FirstName, user.LastName, user.PhoneNumber };

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.PhoneNumber = request.PhoneNumber;

        await unitOfWork.Users.UpdateAsync(user);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(null, AuditActions.UpdateUser, nameof(User), user.Id, oldValues, request);

        await cache.RemoveByPrefixAsync("users:");
        await cache.RemoveByPrefixAsync("mentors:");
        await cache.RemoveByPrefixAsync("students:");
        await cache.RemoveByPrefixAsync("profiles:");

        logger.LogInformation("User updated: {UserId}", id);

        return Result<UserDetailResponse>.Ok(MapToDetailResponse(user));
    }

    public async Task<Result<bool>> SetActiveAsync(int id, bool isActive)
    {
        var user = await unitOfWork.Users.GetByIdAsync(id);
        if (user is null)
            return Result<bool>.Fail("User not found");

        var oldValues = new { user.IsActive };

        user.IsActive = isActive;

        await unitOfWork.Users.UpdateAsync(user);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            null,
            isActive ? AuditActions.ActivateUser : AuditActions.DeactivateUser,
            nameof(User),
            user.Id,
            oldValues,
            new { IsActive = isActive }
        );

        await cache.RemoveByPrefixAsync(UserCachePrefix);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var user = await unitOfWork.Users.GetByIdAsync(id);
        if (user is null)
            return Result<bool>.Fail("User not found");

        if (user.RoleId == 2)
        {
            var mentor = await unitOfWork.Mentors.GetByUserIdAsync(id);
            if (mentor is not null)
            {
                await unitOfWork.Mentors.DeleteAsync(mentor.Id);
                logger.LogInformation("Mentor deleted: {MentorId} for UserId: {UserId}", mentor.Id, id);
            }
        }
        else if (user.RoleId == 3)
        {
            var student = await unitOfWork.Students.GetByUserIdAsync(id);
            if (student is not null)
            {
                await unitOfWork.Students.DeleteAsync(student.Id);
                logger.LogInformation("Student deleted: {StudentId} for UserId: {UserId}", student.Id, id);
            }
        }

        // 2️⃣ Удаляем Profile если есть
        var profile = await unitOfWork.Profiles.GetByUserIdAsync(id);
        if (profile is not null)
        {
            await unitOfWork.Profiles.DeleteAsync(profile.Id);
            logger.LogInformation("Profile deleted for UserId: {UserId}", id);
        }

        // 3️⃣ Удаляем User
        await unitOfWork.Users.DeleteAsync(id);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            null,
            AuditActions.DeleteUser,
            nameof(User),
            id,
            new { user.FullName, user.Email, user.RoleId }
        );

        // 4️⃣ Инвалидируем все кэши
        await cache.RemoveByPrefixAsync(UserCachePrefix);
        await cache.RemoveByPrefixAsync("mentors:");
        await cache.RemoveByPrefixAsync("students:");
        await cache.RemoveByPrefixAsync("profiles:");

        logger.LogInformation("User deleted: {UserId} {Email}", id, user.Email);

        return Result<bool>.Ok(true);
    }

    private static UserResponse MapToResponse(User user)
    {
        return new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role.Name,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    private static UserDetailResponse MapToDetailResponse(User user)
    {
        return new UserDetailResponse
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role.Name,
            IsActive = user.IsActive,
            IsPasswordSet = user.IsPasswordSet,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            AvatarUrl = user.Profile?.AvatarUrl,
            TelegramUsername = user.Profile?.TelegramUsername,
            GithubUrl = user.Profile?.GithubUrl,
            AboutMe = user.Profile?.AboutMe
        };
    }
}