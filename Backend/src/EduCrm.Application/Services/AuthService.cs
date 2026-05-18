using System.Security.Cryptography;
using System.Text;
using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Auth.Request;
using EduCrm.Application.DTOs.Auth.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
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
    IConfiguration configuration) : IAuthService
{
    private const string UserCachePrefix = "users:";

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var user = await unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null)
        {
            logger.LogWarning("Login failed - user not found: {Email}", request.Email);
            return Result<AuthResponse>.Fail("Invalid email or password");
        }

        if (!user.IsActive)
        {
            logger.LogWarning("Login failed - account disabled: {Email}", request.Email);
            return Result<AuthResponse>.Fail("Account is disabled", ErrorType.Forbidden);
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            logger.LogWarning("Login failed - wrong password: {Email}", request.Email);
            return Result<AuthResponse>.Fail("Invalid email or password", ErrorType.Unauthorized);
        }

        logger.LogInformation("User logged in: {Email} Role: {Role}", user.Email, user.Role.Name);

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
            $"auth:user:{user.Id}",
            userInfo,
            TimeSpan.FromMinutes(60));

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

        await unitOfWork.SaveChangesAsync();

        switch (request.RoleId)
        {
            case 2: // Mentor
                var mentor = new Mentor
                {
                    UserId = user.Id,
                    HireDate = DateTime.UtcNow,
                    IsActive = true
                };
                await unitOfWork.Mentors.CreateAsync(mentor);
                break;

            case 3: // Student
                var student = new Student
                {
                    UserId = user.Id,
                    Balance = 0,
                    IsActive = true,
                    EnrolledAt = DateTime.UtcNow
                };
                await unitOfWork.Students.CreateAsync(student);
                break;

            // case 1 (Admin) — профиль роли не нужен
        }

        await unitOfWork.SaveChangesAsync();

        await unitOfWork.Users.LoadRoleAsync(user);

        logger.LogInformation(
            "New user registered by Admin {AdminId}: {Email} Role: {RoleId}",
            adminUserId, user.Email, user.RoleId);

        await cache.RemoveByPrefixAsync(UserCachePrefix);

        await emailService.SendWelcomeAsync(user.Email, user.FullName, tempPassword);

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

        var accessToken = jwtService.GenerateAccessToken(user);
        var refreshToken = jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(
            int.Parse(configuration["Jwt:RefreshTokenExpiryDays"]!));

        await unitOfWork.Users.UpdateAsync(user);
        await unitOfWork.SaveChangesAsync();

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

        await unitOfWork.VerificationCodes.InvalidateAllAsync(user.Id, VerificationCodeType.PasswordReset);

        var code = GenerateCode();
        var codeHash = HashCode(code);

        await unitOfWork.VerificationCodes.CreateAsync(new VerificationCode
        {
            UserId = user.Id,
            CodeHash = codeHash,
            Type = VerificationCodeType.PasswordReset,
            Expiration = DateTime.UtcNow.AddMinutes(5)
        });

        await unitOfWork.SaveChangesAsync();
        await emailService.SendPasswordResetAsync(user.Email, user.FullName, code);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> VerifyCodeAsync(VerifyCodeRequest request)
    {
        var user = await unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null)
            return Result<bool>.Fail("User not found");

        var verificationCode = await unitOfWork.VerificationCodes
            .GetActiveCodeAsync(user.Id, VerificationCodeType.PasswordReset);

        if (verificationCode is null)
            return Result<bool>.Fail("Code not found or expired", ErrorType.BadRequest);

        verificationCode.Attempts++;

        if (verificationCode.CodeHash != HashCode(request.Code))
        {
            await unitOfWork.VerificationCodes.UpdateAsync(verificationCode);
            await unitOfWork.SaveChangesAsync();
            return Result<bool>.Fail("Invalid code", ErrorType.BadRequest);
        }

        verificationCode.IsUsed = true;
        verificationCode.UsedAt = DateTime.UtcNow;
        await unitOfWork.VerificationCodes.UpdateAsync(verificationCode);
        await unitOfWork.SaveChangesAsync();

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

        logger.LogInformation("User logged out: {UserId}", userId);

        await cache.RemoveByPrefixAsync(UserCachePrefix);

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
        var random = new Random();
        return new string(Enumerable.Range(0, 10)
            .Select(_ => chars[random.Next(chars.Length)])
            .ToArray());
    }
}