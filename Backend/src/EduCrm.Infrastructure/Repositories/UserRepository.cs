using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class UserRepository(AppDbContext context) : IUserRepository
{
    public async Task<List<User>> GetAllAsync()
        => await context.Users
            .Include(x => x.Role)
            .Include(x => x.Profile)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

    public async Task<List<User>> GetByRoleAsync(int roleId)
        => await context.Users
            .Include(x => x.Role)
            .Include(x => x.Profile)
            .Where(x => x.RoleId == roleId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    
    public async Task<User?> GetByIdAsync(int id)
        => await context.Users
            .Include(x => x.Role)
            .Include(x => x.Profile)
            .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<User?> GetByEmailAsync(string email)
        => await context.Users
            .Include(x => x.Role)
            .Include(x => x.Profile)
            .FirstOrDefaultAsync(x => x.Email == email.ToLower());
    
    public async Task<User?> GetByRefreshTokenAsync(string refreshToken)
        => await context.Users
            .Include(x => x.Role)
            .Include(x => x.Profile)
            .FirstOrDefaultAsync(x => x.RefreshToken == refreshToken);

    public async Task<bool> ExistsByEmailAsync(string email)
        => await context.Users
            .AnyAsync(x => x.Email == email.ToLower());

    public async Task<User> CreateAsync(User user)
    {
        user.Email = user.Email.ToLower();
        context.Users.Add(user);
        await context.SaveChangesAsync();
        
        await context.Entry(user).Reference(x => x.Role).LoadAsync();

        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        context.Users.Update(user);
        await context.SaveChangesAsync();
        return user;
    }

    public async Task DeleteAsync(int id)
    {
        var user = await context.Users.FindAsync(id);
        if (user is null) return;
        context.Users.Remove(user);
        await context.SaveChangesAsync();
    }
}