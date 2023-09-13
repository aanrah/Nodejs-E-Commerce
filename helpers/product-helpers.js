var db = require("../config/connection");
var collect = require("../config/collection");
const { response } = require("express");
//const { ObjectID } = require("mongodb");
var objectId = require("mongodb").ObjectId;

module.exports = {
  addProduct: (product, callback) => {
    db.get()
      .collection("products")
      .insertOne(product)
      .then((data) => {
        callback(data.insertedId);
      });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collect.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },

  getOneProduct: (prodId) => {
    return new Promise(async (resolve, reject) => {
      let product = await db
        .get()
        .collection(collect.PRODUCT_COLLECTION)
        .findOne({ _id: new objectId(prodId) });
      resolve(product);
    });
  },

  editProduct: (prodId, product) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collect.PRODUCT_COLLECTION)
        .updateOne(
          { _id: new objectId(prodId) },
          {
            $set: {
              Name: product.Name,
              Brand: product.Brand,
              Category: product.Category,
              Description: product.Description,
              Price: product.Price,
            },
          }
        );
      resolve();
    });
  },

  deleteProduct: (prodId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collect.PRODUCT_COLLECTION)
        .deleteOne({ _id: new objectId(prodId) });
      console.log(response);
      resolve(response);
    });
  },

  addToCart: (prodId, userId) => {
    let prodObj = {
      item: new objectId(prodId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collect.CART_COLLECTION)
        .findOne({ user: new objectId(userId) });
      if (userCart) {
        let prodExist = userCart.products.findIndex((i) => i.item == prodId);
        if (prodExist != -1) {
          db.get()
            .collection(collect.CART_COLLECTION)
            .updateOne(
              {
                user: new objectId(userId),
                "products.item": new objectId(prodId),
              },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => resolve());
        } else {
          db.get()
            .collection(collect.CART_COLLECTION)
            .updateOne(
              {
                user: new objectId(userId),
              },
              {
                $push: { products: prodObj },
              }
            )
            .then(() => resolve);
        }
      } else {
        let cartObj = {
          user: new objectId(userId),
          products: [prodObj],
        };
        await db.get().collection(collect.CART_COLLECTION).insertOne(cartObj);
        resolve();
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collect.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: new objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collect.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "productDetails",
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },

  changeProductQuantity: (countDetails) => {
    let count = parseInt(countDetails.count);
    return new Promise((resolve, reject) => {
      if (countDetails.quantity == 1 && count == -1) {
        db.get()
          .collection(collect.CART_COLLECTION)
          .updateOne(
            {
              _id: new objectId(countDetails.cart),
            },
            {
              $pull: {
                products: {
                  item: new objectId(countDetails.product),
                },
              },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collect.CART_COLLECTION)
          .updateOne(
            {
              _id: new objectId(countDetails.cart),
              "products.item": new objectId(countDetails.product),
            },
            {
              $inc: { "products.$.quantity": count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },

  getTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collect.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: new objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collect.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          {
            $unwind: "$productDetails",
          },
          {
            $addFields: {
              productPrice: {
                $toDouble: "$productDetails.Price",
              },
            },
          },
          {
            $project: {
              prodPrice: "$productPrice",
              prodQuantity: "$quantity",
            },
          },
          /* {
            $project: {
              totalProductPrice: {
                $multiply: ["$quantity", "$productDetails.Price"],
              },
            },
          }, */
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: ["$prodQuantity", "$prodPrice"],
                },
              },
            },
          },
        ])
        .toArray();

      resolve(total[0].total);
    });
  },
};
