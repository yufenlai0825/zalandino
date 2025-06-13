const Product = require("../models/product");
const User = require("../models/user"); 
const { validationResult } = require("../middleware/validation");
const fileHelper = require("../middleware/file"); 
const io = require("../socket"); 


exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null, 
    validationErrors: []
  })
  }; 
  
exports.postAddProduct = (req, res, next) => {
  const {title, price, description} = req.body;
  const image = req.file; 
  //console.log(image); 

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true, 
      product: {title: title, price: price, description: description},
      errorMessage: "Attached file is not an image",
      validationErrors: []
    })
  }

  const errors = validationResult(req); 
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true, 
      product: {title: title, price: price, description: description},
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    })
  }
  const imageUrl = image.path; // so we can use imageUrl again

  const product = new Product({
    title: title, 
    imageUrl: imageUrl,
    price: price,
    description: description,
    userID: req.user 
  }); 

  product
  .save() 
  .then(result => {
    io.getIO().emit("products", {action: "add", product: result}); 
    res.redirect("/admin/products"); 
  })
  .catch(err => next(err)); 
}

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit; 
  if(!editMode){ return res.redirect("/")}; 

  const prodID = req.params.productID; 
  Product.findById(prodID) 
  .then((product) => {
    if(!product){ return res.redirect("/") }; 
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode, // "true",
      hasError: false,
      product: product,
      errorMessage: null,
      validationErrors: []
    });
  })
  .catch(err => next(err));  
  }; 

// use fileHelper   
exports.postEditProduct = (req, res, next) => {

  const errors = validationResult(req); 
  const { title, price, description, productID } = req.body;
  const image = req.file;

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true, 
      product: {title: title, price: price, description: description, _id: productID},
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    })
  }

  Product.findById(productID).then(product => {
    // authorization
    if (product.userID.toString() !== req.user._id.toString() ){
      return res.redirect("/")
    }; 
    product.title = title;
    product.price = price;
    product.description = description;
    if (image) {
      fileHelper.deleteFile(product.imageUrl); 
      product.imageUrl = image.path // delete the old image 
    } 

    return product
    .save()
    .then(result => {
      io.getIO().emit("products", {action: "update", product: result}); 
      res.redirect("/admin/products");
  })
  })
  .catch(err => next(err)); 
};   

exports.getProducts = (req, res, next) => {
  // authorization
    Product.find({ userID: req.user._id })
    .then((products) => {
      res.render('admin/products', {
      prods: products,
      path: '/admin/products',
      pageTitle: 'Admin Products'
    })
  })
  .catch(err => next(err));
}; 

exports.deleteProduct = (req, res, next) => {
  const prodID = req.params.productID; // update to params too 
  
  Product.findById(prodID)
  .then(product => {
    if (!product) {
      return next(new Error("Product not found."))
    }

    fileHelper.deleteFile(product.imageUrl); // remove old image
    return Product.findByIdAndDelete({ _id: prodID, userID: req.user._id })
    .then(()=> {
      return User.updateMany({}, { $pull: {"cart.items" : {productID: prodID }} }); 
      // when a product is removed, also empty the product inside all user carts
    })
    .then(() => {
    res.status(200).json({message: "Successfully delete product!"}); // send the json res
    })
  .catch(err => {res.status(500).json({message: "Delete product failed."})}); 
  })
  .catch(err => next(err)); 
} 
