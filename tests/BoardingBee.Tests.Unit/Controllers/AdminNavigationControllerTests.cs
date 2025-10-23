using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Controllers;
using BoardingBee_backend.Models;
using BoardingBee_backend.Services.Notifications;
using System.Linq;

public class AdminNavigationControllerTests
{
    [Fact]
    public async Task Pending_ReturnsPendingListings_ForAdmin()
    {
        // Arrange
        var pendingListings = new List<Listing>
        {
            new Listing { Id = 1, Status = ListingStatus.Pending, Title = "Test Listing" }
        }.AsQueryable();

        var mockSet = new Mock<DbSet<Listing>>();
        mockSet.As<IQueryable<Listing>>().Setup(m => m.Provider).Returns(pendingListings.Provider);
        mockSet.As<IQueryable<Listing>>().Setup(m => m.Expression).Returns(pendingListings.Expression);
        mockSet.As<IQueryable<Listing>>().Setup(m => m.ElementType).Returns(pendingListings.ElementType);
        mockSet.As<IQueryable<Listing>>().Setup(m => m.GetEnumerator()).Returns(pendingListings.GetEnumerator());

        var mockContext = new Mock<AppDbContext>();
        mockContext.Setup(c => c.Listings).Returns(mockSet.Object);

        var mockNotify = new Mock<NotificationService>(null);

        var controller = new AdminListingsController(mockContext.Object, mockNotify.Object);

        // Act
        var result = await controller.Pending();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        dynamic value = okResult.Value;
        Assert.Equal(1, (int)value.total);
        Assert.Single(value.items);
        Assert.Equal(ListingStatus.Pending, value.items[0].Status);
    }

    [Fact]
    public async Task Approve_ChangesStatusAndSendsNotification()
    {
        // Arrange
        var listing = new Listing { Id = 2, Status = ListingStatus.Pending, Title = "Approve Me", OwnerId = 5 };
        var listings = new List<Listing> { listing }.AsQueryable();

        var mockSet = new Mock<DbSet<Listing>>();
        mockSet.As<IQueryable<Listing>>().Setup(m => m.Provider).Returns(listings.Provider);
        mockSet.As<IQueryable<Listing>>().Setup(m => m.Expression).Returns(listings.Expression);
        mockSet.As<IQueryable<Listing>>().Setup(m => m.ElementType).Returns(listings.ElementType);
        mockSet.As<IQueryable<Listing>>().Setup(m => m.GetEnumerator()).Returns(listings.GetEnumerator());
        mockSet.Setup(m => m.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<Listing, bool>>>(), default))
            .ReturnsAsync(listing);

        var mockContext = new Mock<AppDbContext>();
        mockContext.Setup(c => c.Listings).Returns(mockSet.Object);
        mockContext.Setup(c => c.SaveChangesAsync(default)).ReturnsAsync(1);

        var mockNotify = new Mock<NotificationService>(null);
        mockNotify.Setup(n => n.QueueAndSendAsync(It.IsAny<NotificationType>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), null, It.IsAny<int?>()))
            .Returns(Task.CompletedTask);

        var controller = new AdminListingsController(mockContext.Object, mockNotify.Object);

        // Act
        var result = await controller.Approve(new AdminListingsController.ActionDto(listing.Id, null));

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.True((bool)okResult.Value.GetType().GetProperty("ok").GetValue(okResult.Value));
        Assert.Equal(ListingStatus.Approved, listing.Status);
        mockNotify.Verify(n => n.QueueAndSendAsync(
            NotificationType.ListingApproved, listing.OwnerId.Value, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), null, listing.Id), Times.Once);
    }

    [Fact]
    public async Task Reject_ChangesStatusAndSendsNotification()
    {
        // Arrange
        var listing = new Listing { Id = 3, Status = ListingStatus.Pending, Title = "Reject Me", OwnerId = 6 };
        var listings = new List<Listing> { listing }.AsQueryable();

        var mockSet = new Mock<DbSet<Listing>>();
        mockSet.As<IQueryable<Listing>>().Setup(m => m.Provider).Returns(listings.Provider);
        mockSet.As<IQueryable<Listing>>().Setup(m => m.Expression).Returns(listings.Expression);
        mockSet.As<IQueryable<Listing>>().Setup(m => m.ElementType).Returns(listings.ElementType);
        mockSet.As<IQueryable<Listing>>().Setup(m => m.GetEnumerator()).Returns(listings.GetEnumerator());
        mockSet.Setup(m => m.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<Listing, bool>>>(), default))
            .ReturnsAsync(listing);

        var mockContext = new Mock<AppDbContext>();
        mockContext.Setup(c => c.Listings).Returns(mockSet.Object);
        mockContext.Setup(c => c.SaveChangesAsync(default)).ReturnsAsync(1);

        var mockNotify = new Mock<NotificationService>(null);
        mockNotify.Setup(n => n.QueueAndSendAsync(It.IsAny<NotificationType>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), null, It.IsAny<int?>()))
            .Returns(Task.CompletedTask);

        var controller = new AdminListingsController(mockContext.Object, mockNotify.Object);

        // Act
        var result = await controller.Reject(new AdminListingsController.ActionDto(listing.Id, "Not suitable"));

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.True((bool)okResult.Value.GetType().GetProperty("ok").GetValue(okResult.Value));
        Assert.Equal(ListingStatus.Rejected, listing.Status);
        mockNotify.Verify(n => n.QueueAndSendAsync(
            NotificationType.ListingRejected, listing.OwnerId.Value, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), null, listing.Id), Times.Once);
    }
}