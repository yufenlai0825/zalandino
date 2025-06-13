const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const createOrderFromUser = require("../middleware/createOrder");
const env = require("dotenv");
env.config();

const ITEMS_PER_PAGE = 2;
const stripe = require("stripe")(process.env.STRIPE_SK);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        path: "/products",
        pageTitle: "Products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch((err) => next(err));
};

exports.getProduct = (req, res, next) => {
  const prodID = req.params.productID;
  Product.findById(prodID)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products"
      });
    })
    .catch((err) => next(err));
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        path: "/",
        pageTitle: "Zalandino",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch((err) => next(err));
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productID")
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products
      });
    })
    .catch((err) => next(err));
};

exports.postCart = (req, res, next) => {
  const prodID = req.body.productID;

  Product.findById(prodID)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => next(err));
};

exports.postCartMinusOne = (req, res, next) => {
  const prodID = req.body.productID;

  Product.findById(prodID)
    .then((product) => {
      return req.user.removeOne(product);
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => next(err));
};

exports.postCartDeleteItem = (req, res, next) => {
  const prodID = req.body.productID;
  req.user
    .removeFromCart(prodID)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => next(err));
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;

  req.user
    .populate("cart.items.productID")
    .then((user) => {
      products = user.cart.items;
      // get products qty
      total = 0;
      products.forEach((p) => {
        total += p.qty * p.productID.price;
      });

      // create session + key
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        payment_intent_data: { capture_method: "manual" },
        line_items: products.map((p) => {
          return {
            // data stripe needs
            price_data: {
              currency: "eur",
              product_data: {
                name: p.productID.title,
                description: p.productID.description
              },
              unit_amount: p.productID.price * 100 // stripe expects price in cents
            },
            quantity: p.qty
          };
        }),
        mode: "payment", // one-time payment
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success", 
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
        client_reference_id: req.user._id.toString() 
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: products,
        totalSum: total,
        sessionId: session.id, // id from stripe session
        stripePublicKey: process.env.STRIPE_PK // pass to EJS
      });
    })
    .catch((err) => console.log(err));
};

exports.getCheckoutSuccess = (req, res, next) => {
  res.render("shop/success", {
    pageTitle: "Payment Success",
    path: "/checkout/success"
  });
};

exports.postStripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (err) {
    console.log("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // successful payment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userID = session.client_reference_id;
    const paymentIntentID = session.payment_intent;

    console.log("Processing order for user:", userID);
    console.log("Payment Intent ID:", paymentIntentID);
    console.log("Session:", session.id);

    try {
      const user = await User.findById(userID);
      // next doesn't exist in webhook so use res.status.send instead
      if (!user) {
        console.log("User not found for ID:", userID);
        return res.status(400).send("User not found");
      }
      await createOrderFromUser(user); // create new order if user is found
      await stripe.paymentIntents.capture(paymentIntentID); // capture the payment if order is created
      console.log("Order processed for user ID: ", userID);
    } catch (err) {
      // successful payment but err occurs, then cancel
      console.log("Error processing payment:", err.message);
      if (paymentIntentID) {
        await stripe.paymentIntents.cancel(paymentIntentID);
      }
      return res
        .status(500)
        .send("Error occurred while processing the webhook.");
    }
  }
  res.status(200).send("Webhook received");
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userID": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders
      });
    })
    .catch((err) => next(err));
};

exports.getInvoice = (req, res, next) => {
  const orderID = req.params.orderID;

  Order.findById(orderID)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found."));
      }
      if (order.user.userID.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      const invoiceName = "invoice-" + orderID + ".pdf";
      const invoicePath = path.join("invoices", invoiceName);
      const pdfDoc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename:${invoiceName}`);
      pdfDoc.pipe(fs.createWriteStream(invoicePath)); // store it on server
      pdfDoc.pipe(res);
      pdfDoc.fontSize(24).text("Invoice", {
        underline: true
      });
      pdfDoc.text("-------------");
      let totalPrice = 0;
      order.items.forEach((item) => {
        totalPrice += item.qty * item.productData.price;
        pdfDoc
          .fontSize(20)
          .text(
            item.productData.title +
              " - " +
              item.qty +
              " * " +
              "$" +
              item.productData.price
          );
      });
      pdfDoc.fontSize(24).text("-------------");
      pdfDoc.text("Total Price: $" + totalPrice);
      pdfDoc.end();
    })
    .catch((err) => next(err));
};
