const assert = require('assert');
const { Given, When, Then } = require('@cucumber/cucumber');

function createOrder(order) {
    return 'is created'
  }

Given('I choose the products', function () {
    this.products = {
        "customerID": 2,
        "customer": "Victor",
        "amount": 31,
        "orderItens": [
            {
                "name": "sorvete misto",
                "quantity": 1,
                "priceUnit": 3,
                "productID": 2
            },
            {
                "name": "x-burguer",
                "quantity": 1,
                "priceUnit": 20,
                "productID": 5
            },
            {
                "name": "Coca-cola",
                "quantity": 1,
                "priceUnit": 8,
                "productID": 4
            }
    
        ],
        "orderTracking": [],
        "payments": ""
    }
  });

When('I click creater order', function () {
    this.order = createOrder(this.products)
  });

Then('My order {string}', function (orderCreated) {
    assert.strictEqual(this.order, orderCreated);
  });