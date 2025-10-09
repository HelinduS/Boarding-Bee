using Xunit;
using FluentAssertions;

namespace BoardingBee.Tests.Unit.Smoke {
  [Trait("Type","Unit")]
  public class SmokeTests {
    [Fact]
    public void Unit_Framework_WiresUp() {
      true.Should().BeTrue();
    }
  }
}