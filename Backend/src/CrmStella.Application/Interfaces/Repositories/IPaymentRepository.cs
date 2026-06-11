using CrmStella.Domain.Entities;

namespace CrmStella.Application.Interfaces.Repositories;

public interface IPaymentRepository
{
    Task<List<Payment>> GetAllAsync();
    Task<List<Payment>> GetByStudentIdAsync(int studentId);
    Task<List<Payment>> GetByGroupIdAsync(int groupId);
    Task<Payment?> GetByIdAsync(int id);
    Task<decimal> GetStudentBalanceAsync(int studentId);
    public Task<List<Payment>> GetAllConfirmedAsync();
    Task CreateAsync(Payment payment);
    Task UpdateAsync(Payment payment);
    Task DeleteAsync(Payment payment);
}