const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shop");
const isAuth = require("../middleware/is-auth");

router.get("/", shopController.getIndex);
router.get("/products", shopController.getProducts);
router.get("/products/:productID", shopController.getProduct);
router.get("/cart", isAuth, shopController.getCart);
router.post("/cart", isAuth, shopController.postCart);
router.post("/cart-delete-item", isAuth, shopController.postCartDeleteItem);
router.post("/cart-delete-one", isAuth, shopController.postCartMinusOne);

router.get("/checkout", isAuth, shopController.getCheckout);

router.get("/checkout/success", shopController.getCheckoutSuccess); // if succeed re-direct user to see the order
router.get("/checkout/cancel", shopController.getCheckout); // if failed re-direct user to checkout page

router.get("/orders", isAuth, shopController.getOrders);
router.get("/orders/:orderID", isAuth, shopController.getInvoice);

module.exports = router;
