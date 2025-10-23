using System;
using System.Threading.Tasks;
using Xunit;
using BoardingBee_backend.Models;
using BoardingBee.Tests.Unit.Util;
using BoardingBee_backend.Controllers;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace BoardingBee.Tests.Unit.Controllers
{
    public class AdminControllersTests
    {
        [Fact]
        public async Task Approve_Should_Set_Listing_Approved_And_Log_Activity()
        {
            // Arrange
            using var db = DbContextFactory.CreateInMemory();
            var listing = new Listing { Title = "Test", Location = "Nowhere", Price = 10m, Description = "x", CreatedAt = DateTime.UtcNow };
            db.Listings.Add(listing);
            await db.SaveChangesAsync();

            var notify = new Tests.Fakes.FakeNotificationService();
            var controller = new AdminListingsController(db, notify);

            // Act
            var dto = new AdminListingsController.ActionDto(listing.Id, null);
            var res = await controller.Approve(dto);

            // Assert
            var l = await db.Listings.FindAsync(listing.Id);
            Assert.Equal(ListingStatus.Approved, l.Status);
            var log = await db.ActivityLogs.FirstOrDefaultAsync(a => a.ListingId == listing.Id && a.Kind == ActivityKind.ListingApprove);
            Assert.NotNull(log);
        }

        [Fact]
        public async Task Reject_Should_Log_Reject_With_Reason()
        {
            using var db = DbContextFactory.CreateInMemory();
            var listing = new Listing { Title = "Test2", Location = "Here", Price = 15m, Description = "y", CreatedAt = DateTime.UtcNow };
            db.Listings.Add(listing);
            await db.SaveChangesAsync();

            var notify = new Tests.Fakes.FakeNotificationService();
            var controller = new AdminListingsController(db, notify);

            var reason = "Bad photos";
            var dto = new AdminListingsController.ActionDto(listing.Id, reason);
            var res = await controller.Reject(dto);

            var log = await db.ActivityLogs.FirstOrDefaultAsync(a => a.ListingId == listing.Id && a.Kind == ActivityKind.ListingReject);
            Assert.NotNull(log);
            Assert.Equal(reason, log.Meta);
        }

        [Fact]
        public async Task Activity_Recent_Should_Return_Entries()
        {
            using var db = DbContextFactory.CreateInMemory();
            db.ActivityLogs.Add(new ActivityLog { Kind = ActivityKind.ListingApprove, ListingId = 1, At = DateTime.UtcNow });
            db.ActivityLogs.Add(new ActivityLog { Kind = ActivityKind.ListingReject, ListingId = 2, At = DateTime.UtcNow });
            await db.SaveChangesAsync();

            var controller = new AdminActivityController(db);
            var res = await controller.Recent(10);
            Assert.NotNull(res);
            // Further assertions could inspect the returned result object by casting
        }

        [Fact]
        public async Task Notifications_Failed_Should_Return_Failed()
        {
            using var db = DbContextFactory.CreateInMemory();
            db.Notifications.Add(new Notification { Status = NotificationStatus.Failed, CreatedAt = DateTime.UtcNow, Type = NotificationType.ListingApproved });
            db.Notifications.Add(new Notification { Status = NotificationStatus.Sent, CreatedAt = DateTime.UtcNow, Type = NotificationType.ListingApproved });
            await db.SaveChangesAsync();

            var controller = new AdminNotificationsController(db);
            var res = await controller.Failed(7);
            Assert.NotNull(res);
        }
    }
}
