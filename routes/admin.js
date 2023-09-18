var express = require("express");
var router = express.Router();
var productHelper = require("../helpers/product-helpers");
var userHelper = require("../helpers/user-helpers");
const fs = require("fs");

const verifyAdmin = (req, res, next) => {
  if (req.session.admin && req.session.adminLoggedIn) {
    next();
  } else {
    return res.status(403).send("Access denied");
  }
};

/* GET products for admin listing */
router.get("/", verifyAdmin, function (req, res, next) {
  productHelper.getAllProducts().then((products) => {
    res.render("admin/admin-products", { products, admin: true });
  });
});

router.get("/add-product", verifyAdmin, function (req, res) {
  res.render("admin/add-product", { admin: true });
});

router.post("/add-product", (req, res) => {
  productHelper.addProduct(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-product", { admin: true });
      } else console.log("Couldnot upload file" + err);
    });
  });
});

router.get("/delete-product/:id", verifyAdmin, (req, res) => {
  let prodId = req.params.id;
  let imgPath = "./public/product-images/" + prodId + ".jpg";
  fs.unlink(imgPath, (err) => {
    if (!err) {
      console.log("Deleted" + imgPath);
    } else {
      console.error(err);
    }
  });
  productHelper.deleteProduct(prodId).then(() => {
    res.redirect("/admin");
  });
});

router.get("/edit-product/:id", verifyAdmin, (req, res) => {
  productHelper.getOneProduct(req.params.id).then((product) => {
    res.render("admin/edit-product", { product, admin: true });
  });
});

router.post("/edit-product/:id", (req, res) => {
  productHelper.editProduct(req.params.id, req.body).then(() => {
    res.redirect("/admin");
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("./public/product-images/" + req.params.id + ".jpg");
    }
  });
});

router.get("/admin-users", verifyAdmin, (req, res) => {
  userHelper.getUsers().then((users) => {
    res.render("admin/admin-users", { users, admin: true });
  });
});

module.exports = router;
