using EduCrm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduCrm.Infrastructure.Persistence.Configurations;

public class StudentProgressConfiguration : IEntityTypeConfiguration<StudentProgress>
{
    public void Configure(EntityTypeBuilder<StudentProgress> builder)
    {
        builder.ToTable("StudentProgress");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.StudentId)
            .IsRequired();

        builder.Property(x => x.GroupId)
            .IsRequired();

        builder.Property(x => x.TotalLessons)
            .HasDefaultValue(0);

        builder.Property(x => x.AttendedLessons)
            .HasDefaultValue(0);

        builder.Property(x => x.AttendanceRate)
            .HasPrecision(5, 2)
            .HasDefaultValue(0);

        builder.Property(x => x.AverageLessonScore)
            .HasPrecision(5, 2)
            .HasDefaultValue(0);

        builder.Property(x => x.AverageHomeworkScore)
            .HasPrecision(5, 2)
            .HasDefaultValue(0);

        builder.Property(x => x.TotalBonusScore)
            .HasPrecision(5, 2)
            .HasDefaultValue(0);

        builder.Property(x => x.ExamsPassed)
            .HasDefaultValue(0);

        builder.Property(x => x.ExamsFailed)
            .HasDefaultValue(0);

        builder.Property(x => x.OverallProgressPercent)
            .HasPrecision(5, 2)
            .HasDefaultValue(0);

        builder.Property(x => x.IsRecommendedForCertificate)
            .HasDefaultValue(false);

        builder.Property(x => x.UpdatedAt)
            .IsRequired();

        builder.HasOne(x => x.Student)
            .WithMany(s => s.StudentProgresses)
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Group)
            .WithMany()
            .HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.StudentId, x.GroupId })
            .IsUnique();
    }
}