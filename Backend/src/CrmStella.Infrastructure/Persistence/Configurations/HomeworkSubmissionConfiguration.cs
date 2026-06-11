using CrmStella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmStella.Infrastructure.Persistence.Configurations;

public class HomeworkSubmissionConfiguration : IEntityTypeConfiguration<HomeworkSubmission>
{
    public void Configure(EntityTypeBuilder<HomeworkSubmission> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TextAnswer)
            .HasMaxLength(2000);

        builder.Property(x => x.FileUrl)
            .HasMaxLength(500);

        builder.Property(x => x.SubmittedAt)
            .IsRequired();

        builder.Property(x => x.IsLate)
            .IsRequired();

        builder.HasOne(x => x.Homework)
            .WithMany(x => x.Submissions)
            .HasForeignKey(x => x.HomeworkId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Student)
            .WithMany(x => x.HomeworkSubmissions)
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.HomeworkId, x.StudentId })
            .IsUnique();

        builder.HasIndex(x => x.StudentId);
    }
}