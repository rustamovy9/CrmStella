using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class UserRepository(AppDbContext context) : IUserRepository
{
    // AsNoTracking для методов чтения
    public async Task<List<User>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await context.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .Include(x => x.Profile)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<User>> GetByRoleAsync(
        int roleId,
        CancellationToken cancellationToken = default)
    {
        return await context.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .Include(x => x.Profile)
            .Where(x => x.RoleId == roleId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    
    public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => await context.Users
            .Include(u => u.Role)
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken); 

    public async Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        return await context.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .Include(x => x.Profile)
            .FirstOrDefaultAsync(x => x.Email == email.ToLower(), cancellationToken);
    }

    public async Task<User?> GetByRefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        return await context.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .Include(x => x.Profile)
            .FirstOrDefaultAsync(x => x.RefreshToken == refreshToken, cancellationToken);
    }

    public async Task<bool> ExistsByEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        return await context.Users
            .AsNoTracking()
            .AnyAsync(x => x.Email == email.ToLower(), cancellationToken);
    }

    public async Task LoadRoleAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        await context.Entry(user)
            .Reference(x => x.Role)
            .LoadAsync(cancellationToken);
    }

    // БЕЗ AsNoTracking для методов записи
    public async Task<User> CreateAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        user.Email = user.Email.ToLower();
        await context.Users.AddAsync(user, cancellationToken);
        return user;
    }

    public Task<User> UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        user.UpdatedAt = DateTime.UtcNow;
        return Task.FromResult(user);
    }

    public async Task DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var user = await context.Users
            .FindAsync([id], cancellationToken);

        if (user is null) return;

        context.Users.Remove(user);
    }
}