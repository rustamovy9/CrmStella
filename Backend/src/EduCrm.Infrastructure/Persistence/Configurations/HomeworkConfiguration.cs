using EduCrm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduCrm.Infrastructure.Persistence.Configurations;

public class HomeworkConfiguration : IEntityTypeConfiguration<Homework>
{
    public void Configure(EntityTypeBuilder<Homework> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(x => x.FileUrl)
            .HasMaxLength(500);

        builder.Property(x => x.Deadline)
            .IsRequired();

        builder.Property(x => x.MaxScore)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.HasOne(x => x.Lesson)
            .WithMany(x => x.Homeworks)
            .HasForeignKey(x => x.LessonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.LessonId);
        builder.HasIndex(x => x.Deadline);
    }
}