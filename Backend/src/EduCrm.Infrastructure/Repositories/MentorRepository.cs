using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Mentor.Request;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class MentorRepository(AppDbContext context) : IMentorRepository
{
    public async Task<PagedResult<Mentor>> GetAllAsync(
        MentorQueryRequest query,
        CancellationToken cancellationToken = default)
    {
        var q = context.Mentors
            .Include(m => m.User)
            .ThenInclude(u => u.Profile)
            .AsQueryable();

        if (query.IsActive.HasValue)
            q = q.Where(m => m.IsActive == query.IsActive.Value);

        if (!string.IsNullOrWhiteSpace(query.Specialization))
            q = q.Where(m => m.Specialization != null &&
                             m.Specialization.ToLower()
                                 .Contains(query.Specialization.ToLower()));

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.ToLower();
            q = q.Where(m =>
                m.User.FirstName.ToLower().Contains(search) ||
                m.User.LastName.ToLower().Contains(search) ||
                m.User.Email.ToLower().Contains(search));
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var items = await q
            .OrderByDescending(m => m.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Mentor>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<Mentor?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.Mentors
            .Include(m => m.User)
            .ThenInclude(u => u.Profile)
            .Include(m => m.Groups)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task<Mentor?> GetByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await context.Mentors
            .Include(m => m.User)
            .ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(m => m.UserId == userId, cancellationToken);
    }

    public async Task<bool> ExistsByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await context.Mentors
            .AnyAsync(m => m.UserId == userId, cancellationToken);
    }

    public async Task CreateAsync(
        Mentor mentor,
        CancellationToken cancellationToken = default)
    {
        await context.Mentors.AddAsync(mentor, cancellationToken);
    }

    public Task UpdateAsync(
        Mentor mentor,
        CancellationToken cancellationToken = default)
    {
        context.Mentors.Update(mentor);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(int id)
    {
        var mentor = await context.Mentors.FindAsync(id);

        if (mentor is not null)
            context.Mentors.Remove(mentor);
    }
}