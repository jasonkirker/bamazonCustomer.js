// Initialize npm packages
var mysql = require("mysql");
var inquirer = require("inquirer");
require("console.table");

// Initilize the connection variable to sync with a MySQL database
var connection = mysql.createConnection({
    host: "localhost",

    // Port: 8889?
    port: 8889,
    user: "root",
    // password?
    password: "",
    database: "bamazon"
});

// Connect with server and load data
connection.connect(function(err) {
    if (err) {
        console.error("error connecting: " + err.stack);
    }
    loadProducts();
});

// f to load products table from database and print
function loadProducts() {
    // selects all the data from MySQL products table
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        // draw table in the terminal using the response
        console.table(res);
        // prompt customer for their product choice, pass the products
        promptCustomerForItem(res);
    });
}

// prompt the customer for a product ID
function promptCustomerForItem(inventory) {
    // what would you like?
    inquirer
        .prompt([
            {
                type: "input",
                name: "choice",
                message: "What is the ID of the item you would like to buy? [Quit with Q]",
                validate: function(val) {
                    return !isNaN(val) || val.toLowerCase() === "q";
                }
            }
        ])
        .then(function(val) {
            // check if user wants to quit
            checkIfShouldExit(val.choice);
            var choiceId = parseInt(val.choice);
            var product = checkInventory(choiceId, inventory);

            // if product with id chosen, prompt customer for quantity
            if (product) {
                promptCustomerForQuantity(product);
            }
            else {
                console.log("\nItem not in inventory.");
                loadProducts();
            }
        });
}

// Prompt for quantity
function promptCustomerForQuantity(product) {
    inquirer
        .prompt([
            {
            type: "input",
            name: "quantity",
            message: "How many would you like? [Quit with Q]",
            validate: function (val) {
                return val > 0 || val.toLowerCase() === "q";
            }
        }
    ])
    .then(function(val) {
        // Check if the user wants to quit the program
        checkIfShouldExit(val.quantity);
        var quantity = parseInt(val.quantity);
  
        // If there isn't enough of the chosen product and quantity, let the user know and re-run loadProducts
        if (quantity > product.stock_quantity) {
          console.log("\nInsufficient quantity!");
          loadProducts();
        }
        else {
          // Otherwise run makePurchase, give it the product information and desired quantity to purchase
          makePurchase(product, quantity);
        }
      });
  }
  
  // Purchase the desired quantity of the desired item
  function makePurchase(product, quantity) {
    connection.query(
      "UPDATE products SET stock_quantity = stock_quantity - ? WHERE item_id = ?",
      [quantity, product.item_id],
      function(err, res) {
        // Let the user know the purchase was successful, re-run loadProducts
        console.log("\nSuccessfully purchased " + quantity + " " + product.product_name + "'s!");
        loadProducts();
      }
    );
  }
  
  // Check to see if the product the user chose exists in the inventory
  function checkInventory(choiceId, inventory) {
    for (var i = 0; i < inventory.length; i++) {
      if (inventory[i].item_id === choiceId) {
        // If a matching product is found, return the product
        return inventory[i];
      }
    }
    // Otherwise return null
    return null;
  }
  
  // Check to see if the user wants to quit the program
  function checkIfShouldExit(choice) {
    if (choice.toLowerCase() === "q") {
      // Log a message and exit the current node process
      console.log("Goodbye!");
      process.exit(0);
    }
}