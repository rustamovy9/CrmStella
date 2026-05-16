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

namespace EduCrm.Application.Services;

public class AuthService(
    IUserRepository userRepository,
    IVerificationCodeRepository verificationCodeRepository,
    IJwtService jwtService,
    IEmailService emailService,
    IConfiguration configuration)
    : IAuthService
{
    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var user = await userRepository.GetByEmailAsync(request.Email);
        if (user is null)
            return Result<AuthResponse>.Fail("Invalid email or password", ErrorType.NotFound);

        if (!user.IsActive)
            return Result<AuthResponse>.Fail("Account is disabled", ErrorType.Forbidden);

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Result<AuthResponse>.Fail("Invalid email or password", ErrorType.Unauthorized);

        var accessToken = jwtService.GenerateAccessToken(user);
        var refreshToken = jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(
            int.Parse(configuration["Jwt:RefreshTokenExpiryDays"]!));

        await userRepository.UpdateAsync(user);

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
    
    public async Task<Result<RegisterResponse>> RegisterAsync(int adminUserId, RegisterRequest request)
    {
        if (request.RoleId < 1 || request.RoleId > 3)
            return Result<RegisterResponse>.Fail("Invalid role", ErrorType.BadRequest);

        if (await userRepository.ExistsByEmailAsync(request.Email))
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

        await userRepository.CreateAsync(user);
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
        var user = await userRepository.GetByRefreshTokenAsync(request.RefreshToken);
        if (user is null)
            return Result<AuthResponse>.Fail("Invalid refresh token", ErrorType.Unauthorized);

        if (user.RefreshTokenExpiry < DateTime.UtcNow)
            return Result<AuthResponse>.Fail("Refresh token expired", ErrorType.Unauthorized);

        var accessToken = jwtService.GenerateAccessToken(user);
        var refreshToken = jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(
            int.Parse(configuration["Jwt:RefreshTokenExpiryDays"]!));

        await userRepository.UpdateAsync(user);

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
        var user = await userRepository.GetByEmailAsync(request.Email);
        if (user is null)
            return Result<bool>.Fail("User not found", ErrorType.NotFound);

        await verificationCodeRepository.InvalidateAllAsync(user.Id, VerificationCodeType.PasswordReset);

        var code = GenerateCode();
        var codeHash = HashCode(code);

        await verificationCodeRepository.CreateAsync(new VerificationCode
        {
            UserId = user.Id,
            CodeHash = codeHash,
            Type = VerificationCodeType.PasswordReset,
            Expiration = DateTime.UtcNow.AddMinutes(5)
        });

        await emailService.SendPasswordResetAsync(user.Email, user.FullName, code);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> VerifyCodeAsync(VerifyCodeRequest request)
    {
        var user = await userRepository.GetByEmailAsync(request.Email);
        if (user is null)
            return Result<bool>.Fail("User not found", ErrorType.NotFound);

        var verificationCode = await verificationCodeRepository
            .GetActiveCodeAsync(user.Id, VerificationCodeType.PasswordReset);

        if (verificationCode is null)
            return Result<bool>.Fail("Code not found or expired", ErrorType.BadRequest);

        verificationCode.Attempts++;

        if (verificationCode.CodeHash != HashCode(request.Code))
        {
            await verificationCodeRepository.UpdateAsync(verificationCode);
            return Result<bool>.Fail("Invalid code", ErrorType.BadRequest);
        }

        verificationCode.IsUsed = true;
        verificationCode.UsedAt = DateTime.UtcNow;
        await verificationCodeRepository.UpdateAsync(verificationCode);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> ResetPasswordAsync(ResetPasswordRequest request)
    {
        if (request.NewPassword != request.ConfirmPassword)
            return Result<bool>.Fail("Passwords do not match", ErrorType.BadRequest);

        var user = await userRepository.GetByEmailAsync(request.Email);
        if (user is null)
            return Result<bool>.Fail("User not found", ErrorType.NotFound);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await userRepository.UpdateAsync(user);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        if (request.NewPassword != request.ConfirmPassword)
            return Result<bool>.Fail("Passwords do not match", ErrorType.BadRequest);

        var user = await userRepository.GetByIdAsync(userId);
        if (user is null)
            return Result<bool>.Fail("User not found", ErrorType.NotFound);

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return Result<bool>.Fail("Current password is incorrect", ErrorType.BadRequest);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await userRepository.UpdateAsync(user);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> LogoutAsync(int userId)
    {
        var user = await userRepository.GetByIdAsync(userId);
        if (user is null)
            return Result<bool>.Fail("User not found", ErrorType.NotFound);

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await userRepository.UpdateAsync(user);

        return Result<bool>.Ok(true);
    }

    private static string GenerateCode()
        => RandomNumberGenerator.GetInt32(100000, 999999).ToString();

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