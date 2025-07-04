const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  items: [
    {
      productData: { type: Object, required: true },
      qty: { type: Number, required: true }
    }
  ],

  user: {
    email: { type: String, required: true },
    userID: { type: Schema.Types.ObjectId, required: true, ref: "User" }
  }
});

module.exports = mongoose.model("Order", orderSchema);
