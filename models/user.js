const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  resetToken: String,
  resetTokenExpiration: Date,
  // both are not required

  cart: {
    items: [
      {
        productID: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        qty: { type: Number, required: true }
      }
    ]
  }
});

// functions
userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productID.toString() === product._id.toString();
  });

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];
  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].qty + 1;
    updatedCartItems[cartProductIndex].qty = newQuantity;
  } else {
    updatedCartItems.push({
      // only store the id and qty
      productID: product._id,
      qty: newQuantity
    });
  }

  const updatedCart = { items: updatedCartItems };
  this.cart = updatedCart;
  return this.save();
};

// delete one item
userSchema.methods.removeOne = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productID.toString() === product._id.toString();
  });

  if (cartProductIndex >= 0) {
    let updatedCartItems = [...this.cart.items];
    const currentQty = updatedCartItems[cartProductIndex].qty;

    if (currentQty <= 1) {
      updatedCartItems = this.cart.items.filter((item) => {
        return item.productID.toString() !== product._id.toString();
      });
    } else {
      updatedCartItems[cartProductIndex].qty -= 1;
    }

    this.cart.items = updatedCartItems;
    return this.save();
  }
};

userSchema.methods.removeFromCart = function (productID) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productID.toString() !== productID.toString();
  });

  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
