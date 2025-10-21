using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;

namespace BoardingBee_backend.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<UserSettings> UserSettings => Set<UserSettings>();
        public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
        public DbSet<TestTable> TestTables => Set<TestTable>();
        public DbSet<PasswordResetTestToken> PasswordResetTestTokens => Set<PasswordResetTestToken>();
        public DbSet<Listing> Listings => Set<Listing>();

        // NEW: reviews table
        public DbSet<Review> Reviews => Set<Review>();

        //admin
        public DbSet<Inquiry> Inquiries => Set<Inquiry>();
        public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
        public DbSet<Notification> Notifications => Set<Notification>();


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1:1 uniqueness per user for UserSettings
            modelBuilder.Entity<UserSettings>()
                .HasIndex(s => s.UserId)
                .IsUnique();

            // NEW: default for ReviewCount so old inserts still work
            modelBuilder.Entity<Listing>()
                .Property(l => l.ReviewCount)
                .HasDefaultValue(0);

            // NEW: each user can leave only one review per listing
            modelBuilder.Entity<Review>()
                .HasIndex(r => new { r.ListingId, r.UserId })
                .IsUnique();

            // NEW: relationships
            modelBuilder.Entity(typeof(Review))
                .HasOne(typeof(Listing), "Listing")
                .WithMany()
                .HasForeignKey("ListingId")
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity(typeof(Review))
                .HasOne(typeof(User), "User")
                .WithMany()
                .HasForeignKey("UserId")
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Listing>()
                .Property(l => l.Price)
                .HasPrecision(18, 2);

                
                
        }
    }
}
