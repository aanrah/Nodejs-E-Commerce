const { log } = require("console");
var express = require("express");
var router = express.Router();
var productHelper = require("../helpers/product-helpers");
var userHelper = require("../helpers/user-helpers");

/* Function to check whether the user is logged in */
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET product listing for users */
router.get("/", function (req, res, next) {
  let user = req.session.user;
  productHelper.getAllProducts().then((products) => {
    res.render("user/user-products", { products, admin: false, user });
  });
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.loginErr });
    req.session.loginErr = false;
  }
});

router.get("/signup", (req, res) => {
  res.render("user/signup");
});

router.post("/signup", (req, res) => {
  userHelper.userSignup(req.body).then((response) => {
    req.session.loggedIn = true;
    req.session.user = response.user;
    res.redirect("/");
  });
});

router.post("/login", (req, res) => {
  userHelper.userLogin(req.body).then((response) => {
    if (response.adminStatus) {
      req.session.admin = true;
      req.session.adminLoggedIn = true;
      res.redirect("/admin");
    } else {
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.loginErr = "Invalid username or password";
        res.redirect("/login");
      }
    }
  });
});

router.get("/cart", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartItems = await productHelper.getCartProducts(req.session.user._id);
  let total = await productHelper.getTotal(req.session.user._id);
  let totalItems = 0;

  cartItems.forEach((cartItem) => {
    totalItems += cartItem.quantity;
  });

  res.render("user/cart", { cartItems, user, total, totalItems });
});

router.get("/add-to-cart/:id", verifyLogin, (req, res) => {
  productHelper.addToCart(req.params.id, req.session.user._id);
});

router.post("/change-product-quantity", async (req, res) => {
  productHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await productHelper.getTotal(req.session.user._id);
    res.json(response);
    //res.status(response).json(total);
  });
});

router.get("/place-order", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let total = await productHelper.getTotal(user._id);
  res.render("user/place-order", { user, total });
});

router.post("/place-order", verifyLogin, async (req, res) => {
  let total = await productHelper.getTotal(req.body.userId);
  productHelper.cartToOrder(req.body, total);
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
