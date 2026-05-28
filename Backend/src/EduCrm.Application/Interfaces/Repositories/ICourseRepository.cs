using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Course.Request;
using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface ICourseRepository
{
    Task<PagedResult<Course>> GetAllAsync(
        CourseQueryRequest query,
        CancellationToken cancellationToken = default);

    Task<Course?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsByNameAsync(string name, CancellationToken cancellationToken = default);

    Task CreateAsync(Course course, CancellationToken cancellationToken = default);
    Task UpdateAsync(Course course, CancellationToken cancellationToken = default);
}