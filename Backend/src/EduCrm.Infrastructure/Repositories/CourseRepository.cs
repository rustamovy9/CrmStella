using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class CourseRepository(AppDbContext context) : ICourseRepository
{
    public async Task<List<Course>> GetAllAsync(
        CancellationToken cancellationToken = default)
        => await context.Courses
            .Include(c => c.Groups)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<Course?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
        => await context.Courses
            .Include(c => c.Groups)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task<bool> ExistsByNameAsync(
        string name,
        CancellationToken cancellationToken = default)
        => await context.Courses
            .AnyAsync(c => c.Name.ToLower() == name.ToLower(), cancellationToken);

    public async Task CreateAsync(
        Course course,
        CancellationToken cancellationToken = default)
        => await context.Courses.AddAsync(course, cancellationToken);

    public Task UpdateAsync(
        Course course,
        CancellationToken cancellationToken = default)
    {
        context.Courses.Update(course);
        return Task.CompletedTask;
    }
}