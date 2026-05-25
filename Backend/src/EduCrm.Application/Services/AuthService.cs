using System.Security.Cryptography;
using System.Text;
using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Auth.Request;
using EduCrm.Application.DTOs.Auth.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class AuthService(
    IUnitOfWork unitOfWork,
    IJwtService jwtService,
    IEmailService emailService,
    ICacheService cache,
    ILogger<AuthService> logger,
    IAuditLogService auditLogService,
    IConfiguration configuration) : IAuthService
{
    private const string UserCachePrefix = "users:";
    private const string AuthUserCachePrefix = "auth:user:";

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var user = await unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null)
            return Result<AuthResponse>.Fail("Invalid email or password");

        if (!user.IsActive)
            return Result<AuthResponse>.Fail("Account is disabled", ErrorType.Forbidden);

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Result<AuthResponse>.Fail("Invalid email or password", ErrorType.Unauthorized);

        await unitOfWork.Users.LoadRoleAsync(user);

        var accessToken = jwtService.GenerateAccessToken(user);
        var refreshToken = jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(
            int.Parse(configuration["Jwt:RefreshTokenExpiryDays"]!));

        await unitOfWork.Users.UpdateAsync(user);
        await unitOfWork.SaveChangesAsync();

        var userInfo = new UserInfoResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role.Name,
            AvatarUrl = user.Profile?.AvatarUrl
        };

        await cache.SetAsync(
            $"{AuthUserCachePrefix}{user.Id}",
            userInfo,
            TimeSpan.FromMinutes(60));

        await auditLogService.LogAsync(
            user.Id,
            AuditActions.Login,
            "User",
            user.Id,
            newValues: new { user.Email, Role = user.Role.Name });

        return Result<AuthResponse>.Ok(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(
                int.Parse(configuration["Jwt:AccessTokenExpiryMinutes"]!)),
            User = userInfo
        });
    }

    public async Task<Result<RegisterResponse>> RegisterAsync(int adminUserId, RegisterRequest request)
    {
        if (request.RoleId < 1 || request.RoleId > 3)
            return Result<RegisterResponse>.Fail("Invalid role", ErrorType.BadRequest);

        if (await unitOfWork.Users.ExistsByEmailAsync(request.Email))
            return Result<RegisterResponse>.Fail("Email already exists", ErrorType.Conflict);

        var tempPassword = GenerateTempPassword();

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email.ToLower(),
            PhoneNumber = request.PhoneNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
            RoleId = request.RoleId,
            IsActive = true,
            IsPasswordSet = false
        };

        await unitOfWork.Users.CreateAsync(user);

        if (request.RoleId == 2)
            await unitOfWork.Mentors.CreateAsync(new Mentor
            {
                User = user,
                HireDate = DateTime.UtcNow,
                IsActive = true
            });
        else if (request.RoleId == 3)
            await unitOfWork.Students.CreateAsync(new Student
            {
                User = user,
                Balance = 0,
                IsActive = true,
                EnrolledAt = DateTime.UtcNow
            });

        await unitOfWork.SaveChangesAsync();
        await unitOfWork.Users.LoadRoleAsync(user);

        await cache.RemoveByPrefixAsync(UserCachePrefix);

        await emailService.SendWelcomeAsync(user.Email, user.FullName, tempPassword);

        await auditLogService.LogAsync(
            adminUserId,
            AuditActions.Register,
            "User",
            user.Id,
            newValues: new { user.FullName, user.Email, user.RoleId });

        return Result<RegisterResponse>.Ok(new RegisterResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role?.Name ?? string.Empty,
            CreatedAt = user.CreatedAt
        });
    }

    public async Task<Result<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var user = await unitOfWork.Users.GetByRefreshTokenAsync(request.RefreshToken);
        if (user is null)
            return Result<AuthResponse>.Fail("Invalid refresh token");

        if (user.RefreshTokenExpiry < DateTime.UtcNow)
            return Result<AuthResponse>.Fail("Refresh token expired", ErrorType.Unauthorized);

        await unitOfWork.Users.LoadRoleAsync(user);

        var accessToken = jwtService.GenerateAccessToken(user);
        var refreshToken = jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(
            int.Parse(configuration["Jwt:RefreshTokenExpiryDays"]!));

        await unitOfWork.Users.UpdateAsync(user);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            user.Id,
            AuditActions.RefreshToken,
            "User",
            user.Id);

        return Result<AuthResponse>.Ok(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(
                int.Parse(configuration["Jwt:AccessTokenExpiryMinutes"]!)),
            User = new UserInfoResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role.Name,
                AvatarUrl = user.Profile?.AvatarUrl
            }
        });
    }

    public async Task<Result<bool>> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null)
            return Result<bool>.Fail("User not found");

        await unitOfWork.VerificationCodes.InvalidateAllAsync(
            user.Id,
            VerificationCodeType.PasswordReset);

        var code = GenerateCode();

        await unitOfWork.VerificationCodes.CreateAsync(new VerificationCode
        {
            UserId = user.Id,
            CodeHash = HashCode(code),
            Type = VerificationCodeType.PasswordReset,
            Expiration = DateTime.UtcNow.AddMinutes(5),
            Attempts = 0
        });

        await unitOfWork.SaveChangesAsync();
        await emailService.SendPasswordResetAsync(user.Email, user.FullName, code);

        await auditLogService.LogAsync(
            user.Id,
            AuditActions.ForgotPassword,
            "User",
            user.Id);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> VerifyCodeAsync(VerifyCodeRequest request)
    {
        var user = await unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null)
            return Result<bool>.Fail("User not found");

        var code = await unitOfWork.VerificationCodes
            .GetActiveCodeAsync(user.Id, VerificationCodeType.PasswordReset);

        if (code is null)
            return Result<bool>.Fail("Code expired", ErrorType.BadRequest);

        if (code.Attempts >= 5)
            return Result<bool>.Fail("Too many attempts", ErrorType.BadRequest);

        code.Attempts++;

        if (code.CodeHash != HashCode(request.Code))
        {
            await unitOfWork.VerificationCodes.UpdateAsync(code);
            await unitOfWork.SaveChangesAsync();
            return Result<bool>.Fail("Invalid code", ErrorType.BadRequest);
        }

        code.IsUsed = true;
        code.UsedAt = DateTime.UtcNow;

        await unitOfWork.VerificationCodes.UpdateAsync(code);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            user.Id,
            AuditActions.SendVerificationCode,
            "VerificationCode",
            code.Id);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> ResetPasswordAsync(ResetPasswordRequest request)
    {
        if (request.NewPassword != request.ConfirmPassword)
            return Result<bool>.Fail("Passwords do not match", ErrorType.BadRequest);

        var user = await unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null)
            return Result<bool>.Fail("User not found");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;

        await unitOfWork.Users.UpdateAsync(user);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(UserCachePrefix);
        await cache.RemoveByPrefixAsync(AuthUserCachePrefix);

        await auditLogService.LogAsync(
            user.Id,
            AuditActions.ResetPassword,
            "User",
            user.Id);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        if (request.NewPassword != request.ConfirmPassword)
            return Result<bool>.Fail("Passwords do not match", ErrorType.BadRequest);

        var user = await unitOfWork.Users.GetByIdAsync(userId);
        if (user is null)
            return Result<bool>.Fail("User not found");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return Result<bool>.Fail("Current password is incorrect", ErrorType.BadRequest);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        await unitOfWork.Users.UpdateAsync(user);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(UserCachePrefix);
        await cache.RemoveByPrefixAsync(AuthUserCachePrefix);

        await auditLogService.LogAsync(
            user.Id,
            AuditActions.ChangePassword,
            "User",
            user.Id);

        return Result<bool>.Ok(true);
    }

    
    public async Task<Result<bool>> LogoutAsync(int userId)
    {
        var user = await unitOfWork.Users.GetByIdAsync(userId);
        if (user is null)
            return Result<bool>.Fail("User not found");

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;

        await unitOfWork.Users.UpdateAsync(user);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(AuthUserCachePrefix);

        await auditLogService.LogAsync(
            user.Id,
            AuditActions.Logout,
            "User",
            user.Id);

        return Result<bool>.Ok(true);
    }

    private static string GenerateCode()
    {
        return RandomNumberGenerator.GetInt32(100000, 999999).ToString();
    }

    private static string HashCode(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code));
        return Convert.ToHexString(bytes);
    }

    private static string GenerateTempPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        return new string(Enumerable.Range(0, 10)
            .Select(_ => chars[RandomNumberGenerator.GetInt32(chars.Length)])
            .ToArray());
    }
    
    public async Task<Result<bool>> AssignRoleAsync(int adminUserId, AssignRoleRequest request, CancellationToken ct = default)
{
    var user = await unitOfWork.Users.GetByIdAsync(request.UserId, ct);
    if (user is null)
        return Result<bool>.Fail("User not found", ErrorType.NotFound);

    if (user.RoleId == request.RoleId)
        return Result<bool>.Fail("User already has this role", ErrorType.BadRequest);

    var oldRoleId = user.RoleId;

    // удаляем старую роль
    if (oldRoleId == (int)UserRole.Mentor)
    {
        var mentor = await unitOfWork.Mentors.GetByUserIdAsync(user.Id, ct);
        if (mentor is not null)
            await unitOfWork.Mentors.DeleteAsync(mentor.Id, ct);
    }
    else if (oldRoleId == (int)UserRole.Student)
    {
        var student = await unitOfWork.Students.GetByUserIdAsync(user.Id, ct);
        if (student is not null)
            await unitOfWork.Students.DeleteAsync(student.Id, ct);
    }
    
    user.RoleId = request.RoleId;
    user.UpdatedAt = DateTime.UtcNow;
    
    if (request.RoleId == (int)UserRole.Mentor)
    {
        var mentor = new Mentor
        {
            UserId = user.Id,       // ✅ только Id, не user объект
            HireDate = DateTime.UtcNow,
            IsActive = true
        };
        await unitOfWork.Mentors.CreateAsync(mentor, ct);
    }
    else if (request.RoleId == (int)UserRole.Student)
    {
        var student = new Student
        {
            UserId = user.Id,       // ✅ только Id, не user объект
            Balance = 0,
            IsActive = true,
            EnrolledAt = DateTime.UtcNow
        };
        await unitOfWork.Students.CreateAsync(student, ct);
    }

    await unitOfWork.Users.UpdateAsync(user, ct);
    await unitOfWork.SaveChangesAsync(ct);

    await cache.RemoveByPrefixAsync(UserCachePrefix);
    await cache.RemoveByPrefixAsync(AuthUserCachePrefix);

    await auditLogService.LogAsync(
        adminUserId,
        AuditActions.AssignRole,
        "User",
        user.Id,
        oldValues: new { RoleId = oldRoleId },
        newValues: new { RoleId = request.RoleId });

    return Result<bool>.Ok(true);
}
}