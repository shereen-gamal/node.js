const express = require("express");
const bcrypt = require("bcrypt");
const { User, validateUser } = require("../models/user");
const { catchAsyncErrors, auth } = require("../middleware");
const _ = require("lodash");

const router = express.Router();

router.get("/", catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();
    const newUsers = users.map((user)=>{
        return  {
            name: user.name,
            email: user.email,
            _id: user._id
        };
    });
    res.json(newUsers);    
}));

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "user not found" })
    res.json({
        name: user.name,
        email: user.email,
        _id: user._id
    });});

router.delete("/:id",auth, async (req, res) => {
    const { id } = req.params;
    //=> if user not present send 404
    const user = await User.findByIdAndDelete(id);
    res.json({
        name: user.name,
        email: user.email,
        _id: user._id
    });
});

router.put("/:id", auth, async (req, res) => {
    // req.user.isAdmin
    const { error } = validateUser(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message })
    const { id } = req.params;
    const { name, password, email } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "user not found" })
    user.name = name;
    user.email = email;
    user.password = password;
    await user.save();
    res.json({
        name: user.name,
        email: user.email,
        _id: user._id
    });
});

router.post("/", async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message })
    const user = await User.findOne({ email: req.body.email })
    if (user) return res.status(400).json({ message: "user already registered" });
    const password = await bcrypt.hash(req.body.password, 10)
    const newUser = new User({ ...req.body, password });
    await newUser.save();
    res.json({
        name: newUser.name,
        email: newUser.email,
        _id: newUser._id
    });
    // res.json(_.omit(newUser, ["password"]))
});

module.exports = router;
