Feature: Create Order
  We want to create a order

  Scenario: Create order
    Given I choose the products
    When I click creater order
    Then My order "is created"