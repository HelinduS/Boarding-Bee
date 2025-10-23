using System;
using System.Threading.Tasks;
using Xunit;
using BoardingBee_backend.Models;
using BoardingBee.Tests.Unit.Util;
using Microsoft.EntityFrameworkCore;

namespace BoardingBee.Tests.Unit.Controllers
{
    // Tests designed to find regressions/edge-cases in admin controllers
    public class AdminControllersEdgeTests
    {
        [Fact]
        public async Task Approve_NonexistentListing_ReturnsNotFound()
        {
            using var db = DbContextFactory.CreateInMemory();
            var notify = new Tests.Fakes.FakeNotificationService();
            var controller = new BoardingBee_backend.Controllers.AdminListingsController(db, notify);

            var dto = new BoardingBee_backend.Controllers.AdminListingsController.ActionDto(9999, null);
            var res = await controller.Approve(dto);

            Assert.IsType<Microsoft.AspNetCore.Mvc.NotFoundResult>(res);
        }

        [Fact]
        public async Task Reject_NonexistentListing_ReturnsNotFound()
        {
            using var db = DbContextFactory.CreateInMemory();
            var notify = new Tests.Fakes.FakeNotificationService();
            var controller = new BoardingBee_backend.Controllers.AdminListingsController(db, notify);

            var dto = new BoardingBee_backend.Controllers.AdminListingsController.ActionDto(9999, "reason");
            var res = await controller.Reject(dto);

            Assert.IsType<Microsoft.AspNetCore.Mvc.NotFoundResult>(res);
        }

        [Fact]
        public async Task Approve_NotificationThrows_ControllerSurvives()
        {
            using var db = DbContextFactory.CreateInMemory();
            var listing = new Listing { Title = "Edge Test", Location = "X", Price = 1m, Description = "d", CreatedAt = DateTime.UtcNow, OwnerId = 1 };
            db.Listings.Add(listing);
            await db.SaveChangesAsync();

            // Use a notifier that throws to ensure controller handles notification errors
            var notify = new Tests.Fakes.ThrowingNotificationService();
            var controller = new BoardingBee_backend.Controllers.AdminListingsController(db, notify);

            var dto = new BoardingBee_backend.Controllers.AdminListingsController.ActionDto(listing.Id, null);
            var res = await controller.Approve(dto);

            // Controller should still return Ok even if notifications fail
            Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(res);
            var l = await db.Listings.FindAsync(listing.Id);
            Assert.Equal(ListingStatus.Approved, l.Status);
        }
    }
}
