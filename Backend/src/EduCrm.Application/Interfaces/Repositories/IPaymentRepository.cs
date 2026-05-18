using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IPaymentRepository
{
    Task<List<Payment>> GetAllAsync();
    Task<List<Payment>> GetByStudentIdAsync(int studentId);
    Task<List<Payment>> GetByGroupIdAsync(int groupId);
    Task<Payment?> GetByIdAsync(int id);

    /// <summary>
    ///     Returns the sum of all payment amounts for a given student (used for balance calculation).
    /// </summary>
    Task<decimal> GetStudentBalanceAsync(int studentId);

    Task CreateAsync(Payment payment);
    Task UpdateAsync(Payment payment);
    Task DeleteAsync(Payment payment);
}