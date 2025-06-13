const Order = require("../models/order");

module.exports = async (user) => {
  const populatedUser = await user.populate("cart.items.productID");
  const products = populatedUser.cart.items.map((i) => ({
    productData: i.productID.toObject(),
    qty: i.qty
  }));
  const order = new Order({
    items: products,
    user: { email: user.email, userID: user._id }
  });
  await order.save();
  await user.clearCart();
  return order;
};
