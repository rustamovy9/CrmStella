using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Users.Request;
using EduCrm.Application.DTOs.Users.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;

namespace EduCrm.Application.Services;

public class UserService(IUserRepository userRepository) : IUserService
{
    public async Task<Result<List<UserResponse>>> GetAllAsync()
    {
        var users = await userRepository.GetAllAsync();

        var response = users.Select(x => new UserResponse
        {
            Id = x.Id,
            FullName = x.FullName,
            Email = x.Email,
            PhoneNumber = x.PhoneNumber,
            Role = x.Role.Name,
            IsActive = x.IsActive,
            CreatedAt = x.CreatedAt
        }).ToList();

        return Result<List<UserResponse>>.Ok(response);
    }

    public async Task<Result<List<UserResponse>>> GetByRoleAsync(int roleId)
    {
        var users = await userRepository.GetByRoleAsync(roleId);

        var response = users.Select(x => new UserResponse
        {
            Id = x.Id,
            FullName = x.FullName,
            Email = x.Email,
            PhoneNumber = x.PhoneNumber,
            Role = x.Role.Name,
            IsActive = x.IsActive,
            CreatedAt = x.CreatedAt
        }).ToList();

        return Result<List<UserResponse>>.Ok(response);
    }

    public async Task<Result<UserDetailResponse>> GetByIdAsync(int id)
    {
        var user = await userRepository.GetByIdAsync(id);
        if (user is null)
            return Result<UserDetailResponse>.Fail("User not found", ErrorType.NotFound);

        return Result<UserDetailResponse>.Ok(new UserDetailResponse
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
        });
    }

    public async Task<Result<UserDetailResponse>> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await userRepository.GetByIdAsync(id);
        if (user is null)
            return Result<UserDetailResponse>.Fail("User not found", ErrorType.NotFound);

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.PhoneNumber = request.PhoneNumber;

        await userRepository.UpdateAsync(user);

        return Result<UserDetailResponse>.Ok(new UserDetailResponse
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
        });
    }

    public async Task<Result<bool>> SetActiveAsync(int id, bool isActive)
    {
        var user = await userRepository.GetByIdAsync(id);
        if (user is null)
            return Result<bool>.Fail("User not found", ErrorType.NotFound);

        user.IsActive = isActive;
        await userRepository.UpdateAsync(user);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var user = await userRepository.GetByIdAsync(id);
        if (user is null)
            return Result<bool>.Fail("User not found", ErrorType.NotFound);

        await userRepository.DeleteAsync(id);

        return Result<bool>.Ok(true);
    }
}